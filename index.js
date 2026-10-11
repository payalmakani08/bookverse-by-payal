
const express = require('express');

const app = express();
app.use(express.json({ limit: '100kb' }));

let nextId = 4;

let books = [
  {
    id: 1,
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Self-Help',
    year: 2018,
    rating: 5,
    status: 'Reading',
    cover: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
    description: 'Small habits can lead to remarkable results.'
  },
  {
    id: 2,
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    category: 'Fiction',
    year: 1988,
    rating: 5,
    status: 'Completed',
    cover: 'https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg',
    description: 'A journey of dreams, purpose and self-discovery.'
  },
  {
    id: 3,
    title: 'Deep Work',
    author: 'Cal Newport',
    category: 'Productivity',
    year: 2016,
    rating: 4,
    status: 'Want to Read',
    cover: 'https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg',
    description: 'Learn to focus without distraction.'
  }
];

const categories = [
  'Fiction',
  'Non-Fiction',
  'Self-Help',
  'Technology',
  'Science',
  'Productivity',
  'Biography',
  'Other'
];

const statuses = ['Want to Read', 'Reading', 'Completed'];

function validateBook(body) {
  const { title, author, category, year, rating, status, cover, description } = body;

  if (
    typeof title !== 'string' || !title.trim() ||
    typeof author !== 'string' || !author.trim()
  ) {
    return 'A book title and author are required.';
  }

  if (!categories.includes(category)) {
    return 'Please select a valid category.';
  }

  if (
    !Number.isInteger(Number(year)) ||
    Number(year) < 0 ||
    Number(year) > new Date().getFullYear()
  ) {
    return 'Please enter a valid publication year.';
  }

  if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
    return 'Rating must be a whole number from 1 to 5.';
  }

  if (!statuses.includes(status)) {
    return 'Please select a valid reading status.';
  }

  for (const [field, value] of Object.entries({ cover, description })) {
    if (value !== undefined && typeof value !== 'string') {
      return `${field} must be text.`;
    }
  }

  return null;
}

function cleanBook(body, id) {
  return {
    id,
    title: body.title.trim(),
    author: body.author.trim(),
    category: body.category,
    year: Number(body.year),
    rating: Number(body.rating),
    status: body.status,
    cover: typeof body.cover === 'string' ? body.cover.trim() : '',
    description: typeof body.description === 'string'
      ? body.description.trim()
      : ''
  };
}

app.get('/api', (req, res) => {
  res.json({
    name: 'BookVerse API',
    creator: 'Payal Makani',
    version: '1.0.0',
    endpoints: [
      'GET /api/books',
      'GET /api/books/:id',
      'POST /api/books',
      'PUT /api/books/:id',
      'PATCH /api/books/:id/status',
      'DELETE /api/books/:id',
      'GET /api/stats'
    ]
  });
});

app.get('/api/books', (req, res) => {
  let result = [...books];

  const q = String(req.query.q || '').toLowerCase().trim();
  const category = String(req.query.category || '');
  const status = String(req.query.status || '');

  if (q) {
    result = result.filter(book =>
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      book.description.toLowerCase().includes(q)
    );
  }

  if (category && category !== 'All') {
    result = result.filter(book => book.category === category);
  }

  if (status && status !== 'All') {
    result = result.filter(book => book.status === status);
  }

  res.json({
    success: true,
    count: result.length,
    data: result
  });
});

app.get('/api/books/:id', (req, res) => {
  const book = books.find(item => item.id === Number(req.params.id));

  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Book not found.'
    });
  }

  res.json({ success: true, data: book });
});

app.post('/api/books', (req, res) => {
  const error = validateBook(req.body);

  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  const book = cleanBook(req.body, nextId++);
  books.unshift(book);

  res.status(201).json({
    success: true,
    message: 'Book created successfully.',
    data: book
  });
});

app.put('/api/books/:id', (req, res) => {
  const index = books.findIndex(item => item.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Book not found.'
    });
  }

  const error = validateBook(req.body);

  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  books[index] = cleanBook(req.body, books[index].id);

  res.json({
    success: true,
    message: 'Book updated successfully.',
    data: books[index]
  });
});

app.patch('/api/books/:id/status', (req, res) => {
  const book = books.find(item => item.id === Number(req.params.id));

  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Book not found.'
    });
  }

  if (!statuses.includes(req.body.status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid reading status.'
    });
  }

  book.status = req.body.status;

  res.json({
    success: true,
    message: 'Reading status updated.',
    data: book
  });
});

app.delete('/api/books/:id', (req, res) => {
  const index = books.findIndex(item => item.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Book not found.'
    });
  }

  const deleted = books.splice(index, 1)[0];

  res.json({
    success: true,
    message: 'Book deleted successfully.',
    data: deleted
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      total: books.length,
      reading: books.filter(book => book.status === 'Reading').length,
      completed: books.filter(book => book.status === 'Completed').length,
      wantToRead: books.filter(book => book.status === 'Want to Read').length,
      averageRating: books.length
        ? Number((books.reduce((sum, book) => sum + book.rating, 0) / books.length).toFixed(1))
        : 0
    }
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.'
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: 'Unexpected server error.'
  });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`BookVerse API running on port ${port}`);
  });
}

module.exports = app;
