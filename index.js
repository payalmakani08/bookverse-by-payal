const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

let books = [
  {
    id: 1,
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self-Help",
    year: 2018,
    rating: 4.8,
    status: "Completed",
    cover: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
    description: "Small habits can lead to remarkable results."
  },
  {
    id: 2,
    title: "Clean Code",
    author: "Robert C. Martin",
    category: "Technology",
    year: 2008,
    rating: 4.7,
    status: "Reading",
    cover: "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
    description: "A practical guide to writing readable software."
  },
  {
    id: 3,
    title: "The Alchemist",
    author: "Paulo Coelho",
    category: "Fiction",
    year: 1988,
    rating: 4.6,
    status: "Want to Read",
    cover: "https://covers.openlibrary.org/b/isbn/9780061122415-L.jpg",
    description: "A journey about dreams, courage, and discovering your path."
  }
];

let nextId = 4;

const validStatuses = ["Want to Read", "Reading", "Completed"];

function sendSuccess(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function validateBook(body) {
  if (!body.title || !String(body.title).trim()) {
    return "Book title is required.";
  }

  if (!body.author || !String(body.author).trim()) {
    return "Author name is required.";
  }

  if (body.status && !validStatuses.includes(body.status)) {
    return "Invalid reading status.";
  }

  return null;
}

// API home
app.get("/api", (req, res) => {
  sendSuccess(res, {
    name: "BookVerse API",
    developer: "Payal Makani",
    version: "1.0.0",
    endpoints: [
      "GET /api/books",
      "GET /api/books/:id",
      "POST /api/books",
      "PUT /api/books/:id",
      "PATCH /api/books/:id/status",
      "DELETE /api/books/:id",
      "GET /api/stats"
    ]
  });
});

// Get all books
app.get("/api/books", (req, res) => {
  let result = [...books];

  if (req.query.search) {
    const search = String(req.query.search).toLowerCase();
    result = result.filter(book =>
      book.title.toLowerCase().includes(search) ||
      book.author.toLowerCase().includes(search)
    );
  }

  if (req.query.category) {
    result = result.filter(book => book.category === req.query.category);
  }

  if (req.query.status) {
    result = result.filter(book => book.status === req.query.status);
  }

  sendSuccess(res, result);
});

// Get one book
app.get("/api/books/:id", (req, res) => {
  const book = books.find(item => item.id === Number(req.params.id));

  if (!book) {
    return res.status(404).json({
      success: false,
      message: "Book not found."
    });
  }

  sendSuccess(res, book);
});

// Statistics
app.get("/api/stats", (req, res) => {
  const total = books.length;
  const reading = books.filter(book => book.status === "Reading").length;
  const completed = books.filter(book => book.status === "Completed").length;
  const averageRating = total
    ? Number((books.reduce((sum, book) => sum + Number(book.rating || 0), 0) / total).toFixed(1))
    : 0;

  sendSuccess(res, { total, reading, completed, averageRating });
});

// Add a book
app.post("/api/books", (req, res) => {
  const error = validateBook(req.body);

  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  const book = {
    id: nextId++,
    title: String(req.body.title).trim(),
    author: String(req.body.author).trim(),
    category: req.body.category || "Other",
    year: Number(req.body.year) || new Date().getFullYear(),
    rating: Math.min(5, Math.max(0, Number(req.body.rating) || 0)),
    status: req.body.status || "Want to Read",
    cover: req.body.cover || "",
    description: req.body.description || ""
  };

  books.push(book);
  sendSuccess(res, book, 201);
});

// Update a book
app.put("/api/books/:id", (req, res) => {
  const index = books.findIndex(item => item.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Book not found."
    });
  }

  const error = validateBook(req.body);

  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  books[index] = {
    ...books[index],
    ...req.body,
    id: books[index].id,
    title: String(req.body.title).trim(),
    author: String(req.body.author).trim()
  };

  sendSuccess(res, books[index]);
});

// Update reading status
app.patch("/api/books/:id/status", (req, res) => {
  const book = books.find(item => item.id === Number(req.params.id));

  if (!book) {
    return res.status(404).json({
      success: false,
      message: "Book not found."
    });
  }

  if (!validStatuses.includes(req.body.status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid reading status."
    });
  }

  book.status = req.body.status;
  sendSuccess(res, book);
});

// Delete a book
app.delete("/api/books/:id", (req, res) => {
  const index = books.findIndex(item => item.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Book not found."
    });
  }

  const deleted = books.splice(index, 1)[0];
  sendSuccess(res, deleted);
});

// Friendly API errors
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });
});

// Serve the app's main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`BookVerse by Payal Makani is running on port ${PORT}`);
});
