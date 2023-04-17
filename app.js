//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');

const app = express();

app.set('view engine', 'ejs');


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
  name: String,
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

// Render create user form for admin
app.get('/create-user', async (req, res) => {
  try {
    const users = await User.find({});
    res.render('create-user', { users: users, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving users from database');
  }
});

// Handle create user form submission
app.post('/create-user', async (req, res) => {
  const {name, email, password, role } = req.body;
  console.log(req.body);
  try {
    // Check if user with same email already exists in database
    const userExists = await User.findOne({ email: email });
    if (userExists) {
      return res.render('create-user', { error: 'User already exists with this email' });
    }
    // Create new user object
    const newUser = new User({
      name,
      email,
      password,
      role
    });
    // Save new user to database
    await newUser.save();
    console.log(newUser);
    // Redirect to admin dashboard
    res.redirect('/dashboard/admin');
  } catch (err) {
    console.error(err);
    res.render('create-user', { error: 'Error creating user' });
  }
});


app.listen(3000, () => console.log('Server started on port 3000'));
