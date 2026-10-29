
/* ==============================
   BOOK DATA
============================== */

const defaultBooks = [
    {
        id: 1,
        title: "The Alchemist",
        author: "Paulo Coelho",
        category: "Fiction",
        price: 299,
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=500&q=80",
        favorite: false
    },
    {
        id: 2,
        title: "Atomic Habits",
        author: "James Clear",
        category: "Self Help",
        price: 399,
        image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=500&q=80",
        favorite: false
    },
    {
        id: 3,
        title: "Clean Code",
        author: "Robert C. Martin",
        category: "Technology",
        price: 550,
        image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=500&q=80",
        favorite: false
    },
    {
        id: 4,
        title: "Rich Dad Poor Dad",
        author: "Robert Kiyosaki",
        category: "Business",
        price: 350,
        image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=500&q=80",
        favorite: false
    },
    {
        id: 5,
        title: "The Psychology of Money",
        author: "Morgan Housel",
        category: "Business",
        price: 420,
        image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=500&q=80",
        favorite: false
    },
    {
        id: 6,
        title: "Think Like a Programmer",
        author: "V. Anton Spraul",
        category: "Technology",
        price: 450,
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=500&q=80",
        favorite: false
    }
];


/* ==============================
   GET HTML ELEMENTS
============================== */

const bookList = document.getElementById("bookList");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const noBooksMessage = document.getElementById("noBooksMessage");

const addBookForm = document.getElementById("addBookForm");

let books = [];


/* ==============================
   LOAD BOOKS
============================== */

function loadBooks() {

    try {
        const savedBooks = localStorage.getItem("bookVerseBooks");

        if (savedBooks) {
            books = JSON.parse(savedBooks);

            if (!Array.isArray(books)) {
                books = [...defaultBooks];
            }
        } else {
            books = [...defaultBooks];
        }

    } catch (error) {
        console.error("Unable to load books:", error);
        books = [...defaultBooks];
    }

    displayBooks(books);
}


/* ==============================
   SAVE BOOKS
============================== */

function saveBooks() {

    try {
        localStorage.setItem(
            "bookVerseBooks",
            JSON.stringify(books)
        );

    } catch (error) {
        console.error("Unable to save books:", error);

        alert("Could not save books in browser storage.");
    }
}


/* ==============================
   ESCAPE HTML
============================== */

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, function (character) {

        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return replacements[character];
    });
}


/* ==============================
   SAFE IMAGE URL
============================== */

function safeImageURL(url) {

    try {
        const parsedURL = new URL(url);

        if (
            parsedURL.protocol === "https:" ||
            parsedURL.protocol === "http:"
        ) {
            return parsedURL.href;
        }

    } catch (error) {
        // Use fallback image below
    }

    return "https://placehold.co/500x600?text=Book";
}


/* ==============================
   DISPLAY BOOKS
============================== */

function displayBooks(bookArray) {

    bookList.innerHTML = "";

    if (bookArray.length === 0) {
        noBooksMessage.style.display = "block";
        return;
    }

    noBooksMessage.style.display = "none";

    bookArray.forEach(function (book) {

        const column = document.createElement("div");

        column.className = "col-6 col-md-4 col-lg-3";

        const imageURL = safeImageURL(book.image);

        column.innerHTML = `
            <div class="book-card">

                <img
                    src="${escapeHTML(imageURL)}"
                    alt="${escapeHTML(book.title)} book cover"
                    class="book-cover"
                    loading="lazy"
                >

                <div class="book-content">

                    <h5>${escapeHTML(book.title)}</h5>

                    <p class="book-author">
                        By ${escapeHTML(book.author)}
                    </p>

                    <span class="book-category">
                        ${escapeHTML(book.category)}
                    </span>

                    <p class="book-price">
                        ₹${Number(book.price).toLocaleString("en-IN")}
                    </p>

                    <button
                        class="favorite-btn"
                        data-favorite="${book.id}"
                        type="button"
                    >
                        ${book.favorite ? "❤️" : "♡"} Favorite
                    </button>

                    <button
                        class="btn btn-outline-danger btn-sm remove-btn"
                        data-remove="${book.id}"
                        type="button"
                    >
                        Remove
                    </button>

                </div>

            </div>
        `;

        bookList.appendChild(column);
    });
}


/* ==============================
   SEARCH AND FILTER
============================== */

function filterBooks() {

    const searchText = searchInput.value
        .trim()
        .toLowerCase();

    const selectedCategory = categoryFilter.value;

    const filteredBooks = books.filter(function (book) {

        const matchesSearch =
            book.title.toLowerCase().includes(searchText) ||
            book.author.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "All" ||
            book.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    displayBooks(filteredBooks);
}


/* ==============================
   ADD A BOOK
============================== */

addBookForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const title = document.getElementById("bookTitle").value.trim();

    const author = document.getElementById("bookAuthor").value.trim();

    const category = document.getElementById("bookCategory").value;

    const price = Number(document.getElementById("bookPrice").value);

    const imageInput = document.getElementById("bookImage").value.trim();

    if (!title || !author || !Number.isFinite(price) || price < 0) {
        alert("Please enter valid book details.");
        return;
    }

    const image = imageInput ||
        "https://placehold.co/500x600?text=Book";

    const newBook = {
        id: Date.now(),
        title: title,
        author: author,
        category: category,
        price: price,
        image: image,
        favorite: false
    };

    books.push(newBook);

    saveBooks();

    // Clear form
    addBookForm.reset();

    // Show all books again
    searchInput.value = "";
    categoryFilter.value = "All";

    filterBooks();

    // Close modal
    const modalElement = document.getElementById("addBookModal");

    const modalInstance =
        bootstrap.Modal.getInstance(modalElement);

    if (modalInstance) {
        modalInstance.hide();
    }

});


/* ==============================
   FAVORITE AND REMOVE
============================== */

bookList.addEventListener("click", function (event) {

    const favoriteButton = event.target.closest("[data-favorite]");

    const removeButton = event.target.closest("[data-remove]");


    // Favorite button
    if (favoriteButton) {

        const bookId = Number(favoriteButton.dataset.favorite);

        books = books.map(function (book) {

            if (book.id === bookId) {
                return {
                    ...book,
                    favorite: !book.favorite
                };
            }

            return book;
        });

        saveBooks();
        filterBooks();
    }


    // Remove button
    if (removeButton) {

        const bookId = Number(removeButton.dataset.remove);

        const confirmDelete = confirm(
            "Do you want to remove this book?"
        );

        if (!confirmDelete) {
            return;
        }

        books = books.filter(function (book) {
            return book.id !== bookId;
        });

        saveBooks();
        filterBooks();
    }

});


/* ==============================
   SEARCH EVENTS
============================== */

searchInput.addEventListener("input", filterBooks);

categoryFilter.addEventListener("change", filterBooks);


/* ==============================
   FOOTER YEAR
============================== */

document.getElementById("currentYear").textContent =
    new Date().getFullYear();


/* ==============================
   START WEBSITE
============================== */

loadBooks();
                  
