
"use strict";

const $ = (id) => document.getElementById(id);

const grid = $("bookGrid");
const form = $("bookForm");
const modal = $("modalBackdrop");

let books = [];
let editingId = null;
let toastTimer;
let searchTimer;
let particleFrame = 0;

// ---------------- API CONNECTION ----------------

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    }
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || `API request failed (${response.status})`);
  }

  return result;
}

// ---------------- NOTIFICATIONS ----------------

function notify(message, isError = false) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.hidden = false;

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 3500);
}

// Safely display user-provided text in HTML.
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// Accept only HTTP(S) URLs for external cover images.
function safeCover(value) {
  try {
    const url = new URL(value);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href;
    }
  } catch {
    // Empty or invalid URL: display the default cover.
  }

  return "";
}

function setApiStatus(online, message) {
  const dot = $("apiDot");

  dot.classList.toggle("online", online);
  dot.classList.toggle("offline", !online);

  $("apiText").textContent = message;
}

// ---------------- LOAD BOOKS ----------------

async function loadBooks() {
  grid.innerHTML = '<div class="loading">Finding your stories ✨</div>';

  try {
    const params = new URLSearchParams();

    const search = $("search").value.trim();
    const category = $("categoryFilter").value;
    const status = $("statusFilter").value;

    if (search) params.set("q", search);
    if (category !== "All") params.set("category", category);
    if (status !== "All") params.set("status", status);

    const result = await api("/api/books?" + params.toString());

    books = Array.isArray(result.data) ? result.data : [];

    const sort = $("sort").value;

    if (sort === "title") {
      books.sort((a, b) =>
        String(a.title).localeCompare(String(b.title))
      );
    } else if (sort === "rating") {
      books.sort((a, b) => Number(b.rating) - Number(a.rating));
    } else if (sort === "year") {
      books.sort((a, b) => Number(b.year) - Number(a.year));
    } else if (sort === "newest") {
      books.sort((a, b) => Number(b.id) - Number(a.id));
    }

    renderBooks();
    await loadStats();

    setApiStatus(true, "Connected · Express API online");
  } catch (error) {
    books = [];

    grid.innerHTML = `
      <div class="empty">
        <div class="empty-icon">⚡</div>
        <h3>Unable to connect to the API</h3>
        <p class="muted">
          ${escapeHTML(error.message)}<br>
          Check that your Express backend is deployed.
        </p>
        <button class="btn primary" id="retryBtn" type="button">
          Retry connection ↻
        </button>
      </div>
    `;

    $("retryBtn").addEventListener("click", loadBooks);

    setApiStatus(false, "API unavailable");

    ["totalStat", "readingStat", "completedStat", "ratingStat"]
      .forEach((id) => {
        $(id).textContent = "—";
      });
  }
}

// ---------------- STATISTICS ----------------

async function loadStats() {
  try {
    const result = await api("/api/stats");
    const stats = result.data;

    $("totalStat").textContent = stats.total ?? 0;
    $("readingStat").textContent = stats.reading ?? 0;
    $("completedStat").textContent = stats.completed ?? 0;

    const rating = Number(stats.averageRating ?? 0);

    $("ratingStat").textContent =
      rating > 0 ? rating.toFixed(1) + " ★" : "—";
  } catch {
    // Calculate basic statistics locally if the stats route is absent.
    $("totalStat").textContent = books.length;
    $("readingStat").textContent =
      books.filter((book) => book.status === "Reading").length;
    $("completedStat").textContent =
      books.filter((book) => book.status === "Completed").length;

    const average = books.length
      ? books.reduce((sum, book) => sum + Number(book.rating || 0), 0)
        / books.length
      : 0;

    $("ratingStat").textContent =
      average > 0 ? average.toFixed(1) + " ★" : "—";
  }
}

// ---------------- DISPLAY BOOK CARDS ----------------

function renderBooks() {
  if (!books.length) {
    grid.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📚</div>
        <h3>Your next chapter starts here</h3>
        <p class="muted">
          No books match your search. Add a new book or clear your filters.
        </p>
        <button class="btn primary" id="firstBookBtn" type="button">
          ＋ Add your first book
        </button>
      </div>
    `;

    $("firstBookBtn").addEventListener("click", () => openModal());

    return;
  }

  grid.innerHTML = books.map((book, index) => {
    const cover = safeCover(book.cover || "");
    const id = Number(book.id);

    const rating = Math.max(
      0,
      Math.min(5, Math.round(Number(book.rating) || 0))
    );

    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

    const coverHTML = cover
      ? `
        <img
          src="${escapeHTML(cover)}"
          alt="Cover of ${escapeHTML(book.title)}"
          loading="lazy"
          onerror="this.hidden=true;this.nextElementSibling.hidden=false"
        >
        <div class="cover-fallback" hidden>📚</div>
      `
      : '<div class="cover-fallback">📚</div>';

    const statuses = ["Want to Read", "Reading", "Completed"];

    return `
      <article class="book-card"
        style="animation-delay:${Math.min(index, 8) * 55}ms">

        <div class="cover">
          ${coverHTML}
          <span class="status">${escapeHTML(book.status)}</span>
        </div>

        <div class="book-info">
          <span class="category">
            ${escapeHTML(book.category)} · ${escapeHTML(book.year)}
          </span>

          <h3>${escapeHTML(book.title)}</h3>

          <div class="author">
            by ${escapeHTML(book.author)}
          </div>

          <p class="description">
            ${escapeHTML(
              book.description ||
              "A new addition to your reading journey."
            )}
          </p>

          <div class="stars" aria-label="${rating} out of 5 stars">
            ${stars}
          </div>

          <div class="card-bottom">
            <select
              class="field status-select"
              aria-label="Reading status for ${escapeHTML(book.title)}"
              data-action="status"
              data-id="${id}"
            >
              ${statuses.map((status) => `
                <option
                  value="${status}"
                  ${status === book.status ? "selected" : ""}
                >${status}</option>
              `).join("")}
            </select>

            <div class="card-actions">
              <button
                class="icon-btn"
                type="button"
                data-action="edit"
                data-id="${id}"
                aria-label="Edit ${escapeHTML(book.title)}"
                title="Edit book"
              >✎</button>

              <button
                class="icon-btn delete"
                type="button"
                data-action="delete"
                data-id="${id}"
                aria-label="Delete ${escapeHTML(book.title)}"
                title="Delete book"
              >⌫</button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// ---------------- OPEN AND CLOSE FORM ----------------

function openModal(book = null) {
  editingId = book ? Number(book.id) : null;

  form.reset();

  $("modalTitle").textContent = book
    ? "Edit your book ✦"
    : "Add a book ✦";

  $("saveBtn").textContent = book
    ? "Save changes ✓"
    : "Save to library ✦";

  $("year").value = book ? book.year : 2024;
  $("rating").value = book ? book.rating : 5;
  $("status").value = book ? book.status : "Want to Read";

  if (book) {
    const fields = [
      "title",
      "author",
      "category",
      "year",
      "rating",
      "status",
      "cover",
      "description"
    ];

    fields.forEach((key) => {
      if (form.elements[key]) {
        form.elements[key].value = book[key] ?? "";
      }
    });
  }

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  setTimeout(() => $("title").focus(), 50);
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  editingId = null;
}

// ---------------- ADD AND UPDATE BOOKS ----------------

async function saveBook(event) {
  event.preventDefault();

  if (!form.reportValidity()) return;

  const data = Object.fromEntries(new FormData(form).entries());

  data.title = data.title.trim();
  data.author = data.author.trim();
  data.description = data.description.trim();
  data.cover = data.cover.trim();
  data.year = Number(data.year);
  data.rating = Number(data.rating);

  const isEditing = editingId !== null;
  const bookId = editingId;

  const button = $("saveBtn");
  button.disabled = true;
  button.textContent = "Saving...";

  try {
    if (isEditing) {
      await api("/api/books/" + encodeURIComponent(bookId), {
        method: "PUT",
        body: JSON.stringify(data)
      });

      notify("Book updated successfully ✨");
    } else {
      await api("/api/books", {
        method: "POST",
        body: JSON.stringify(data)
      });

      notify("A new story joined your library 📚");
    }

    closeModal();
    await loadBooks();
  } catch (error) {
    notify(error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = isEditing
      ? "Save changes ✓"
      : "Save to library ✦";
  }
}

// ---------------- EDIT BOOK ----------------

function editBook(id) {
  const book = books.find((item) => Number(item.id) === Number(id));

  if (!book) {
    notify("Book not found. Refresh and try again.", true);
    return;
  }

  openModal(book);
}

// ---------------- DELETE BOOK ----------------

async function deleteBook(id) {
  const book = books.find((item) => Number(item.id) === Number(id));

  if (!book) {
    notify("Book not found.", true);
    return;
  }

  const confirmed = window.confirm(
    `Remove "${book.title}" from your collection?`
  );

  if (!confirmed) return;

  try {
    await api("/api/books/" + encodeURIComponent(id), {
      method: "DELETE"
    });

    notify("Book removed from your library.");
    await loadBooks();
  } catch (error) {
    notify(error.message, true);
  }
}

// ---------------- CHANGE READING STATUS ----------------

async function changeStatus(id, status) {
  try {
    await api(
      "/api/books/" + encodeURIComponent(id) + "/status",
      {
        method: "PATCH",
        body: JSON.stringify({ status })
      }
    );

    notify("Reading status updated ✓");
    await loadBooks();
  } catch (error) {
    notify(error.message, true);
    await loadBooks();
  }
}

// ---------------- EVENT LISTENERS ----------------

$("addTop").addEventListener("click", () => openModal());

$("addLibrary").addEventListener("click", () => openModal());

$("exploreBtn").addEventListener("click", () => {
  $("library").scrollIntoView({ behavior: "smooth" });
});

$("closeModal").addEventListener("click", closeModal);
$("cancelModal").addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("open")) {
    closeModal();
  }
});

form.addEventListener("submit", saveBook);

grid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;

  if (!Number.isSafeInteger(id)) return;

  if (action === "edit") editBook(id);
  if (action === "delete") deleteBook(id);
});

grid.addEventListener("change", (event) => {
  const select = event.target.closest('select[data-action="status"]');

  if (select) {
    changeStatus(Number(select.dataset.id), select.value);
  }
});

$("search").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadBooks, 300);
});

["categoryFilter", "statusFilter", "sort"].forEach((id) => {
  $(id).addEventListener("change", loadBooks);
});

// ---------------- LIGHT AND DARK THEMES ----------------

function setTheme(isLight) {
  document.body.classList.toggle("light", isLight);

  $("themeBtn").textContent = isLight
    ? "☾ Dark theme"
    : "☼ Light theme";
}

$("themeBtn").addEventListener("click", () => {
  setTheme(!document.body.classList.contains("light"));
});

// ---------------- ANIMATED BACKGROUND ----------------

const canvas = $("particles");
const ctx = canvas.getContext("2d");

let particles = [];

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.min(
    55,
    Math.floor(window.innerWidth / 20)
  );

  particles = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 1.8 + 0.5,
    speed: Math.random() * 0.25 + 0.08,
    opacity: Math.random() * 0.5 + 0.12
  }));
}

function animateParticles() {
  if (!ctx) return;

  if (
    document.hidden ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    requestAnimationFrame(animateParticles);
    return;
  }

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  particles.forEach((particle) => {
    particle.y -= particle.speed;

    if (particle.y < -5) {
      particle.y = window.innerHeight + 5;
      particle.x = Math.random() * window.innerWidth;
    }

    const twinkle =
      0.65 + Math.sin(particleFrame * 0.018 + particle.x) * 0.35;

    ctx.beginPath();

    ctx.arc(
      particle.x,
      particle.y,
      particle.radius,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      `rgba(196,181,253,${particle.opacity * twinkle})`;

    ctx.fill();
  });

  particleFrame++;

  requestAnimationFrame(animateParticles);
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
animateParticles();

// ---------------- START APPLICATION ----------------

loadBooks();
