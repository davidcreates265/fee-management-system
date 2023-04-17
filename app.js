//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');

const app = express();

// Set up session middleware
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
}));

// Set up middleware to parse request body
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
// Connect to the database
mongoose.connect("mongodb://localhost:27017/feeManagementSystemDB", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Could not connect to MongoDB', err));

// Define user schema and model
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
});
const User = mongoose.model('User', userSchema);

// Set up routes
app.get('/', (req, res) => {
  res.render('login.ejs', { error: null });
});

app.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.render('login.ejs', { error: 'Invalid email or password' });
    }

    if (user.password === password) {
      // Set up session data for authenticated user
      req.session.user = {
        email: user.email,
        role: user.role,
      };

      // Redirect user to appropriate dashboard based on role
      if (user.role === 'admin') {
        res.redirect('/dashboard/admin');
      } else if (user.role === 'teacher') {
        res.redirect('/dashboard/teacher');
      } else if (user.role === 'student') {
        res.redirect('/dashboard/student');
      } else {
        res.redirect('/');
      }
    } else {
      return res.render('login.ejs', { error: 'Invalid email or password' });
    }
  } catch (err) {
    console.error(err);
    return res.render('login.ejs', { error: 'An error occurred. Please try again later' });
  }
});

app.get('/dashboard/admin', (req, res) => {
  const user = req.session.user;
  if (user && user.role === 'admin') {
    res.render('dashboard_admin.ejs');
  } else {
    res.redirect('/');
  }
});

app.get('/dashboard/teacher', (req, res) => {
  const user = req.session.user;
  if (user && user.role === 'teacher') {
    res.render('dashboard_teacher.ejs');
  } else {
    res.redirect('/');
  }
});

app.get('/dashboard/student', (req, res) => {
  const user = req.session.user;
  if (user && user.role === 'student') {
    res.render('dashboard_student.ejs');
  } else {
    res.redirect('/');
  }
});

app.listen(3000, () => console.log('Server started on port 3000'));
