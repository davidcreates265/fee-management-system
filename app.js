//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const SchoolYear = require('./models/schoolYear');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));


// Setting up session middleware
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
}));

// Setting up middleware to parse request body
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB 
mongoose.connect("mongodb://localhost:27017/feeManagementSystemDB", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Could not connect to MongoDB', err));

// User schema and model
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
});
const User = mongoose.model('User', userSchema);

// Routes
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
      // Setring up session data for the authenticated user
      req.session.user = {
        email: user.email,
        role: user.role,
      };

      // Redirecting user to the appropriate dashboard based on role
      if (user.role === 'admin') {
        res.redirect('/dashboard/admin');
      } else if (user.role === 'principal') {
        res.redirect('/dashboard/principal');
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

app.get('/dashboard/principal', (req, res) => {
  const user = req.session.user;
  if (user && user.role === 'principal') {
    res.render('dashboard_principal.ejs');
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

// Rendering create user form for the admin
app.get('/create-user', async (req, res) => {
  try {
    const users = await User.find({});
    res.render('create-user', { users: users, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving users from database');
  }
});

// Handling create user form submission
app.post('/create-user', async (req, res) => {
  const {name, email, password, role } = req.body;
  console.log(req.body);
  try {
    // Check if user with same email already exists in database
    const userExists = await User.findOne({ email: email });
    if (userExists) {
      return res.render('create-user', { error: 'User already exists with this email' });
    }
    // Create a new user object
    const newUser = new User({
      name,
      email,
      password,
      role
    });
    // Saving the new user to the database
    await newUser.save();
    console.log(newUser);
    // Redirecting to admin dashboard
    res.redirect('/dashboard/admin');
  } catch (err) {
    console.error(err);
    res.render('create-user', { error: 'Error creating user' });
  }
});


// Rendering the principal dashboard
app.get('/dashboard/principal', (req, res) => {
  const user = req.session.user;
  if (user && user.role === 'principal') {
    res.render('dashboard_principal.ejs');
  } else {
    res.redirect('/');
  }
});


//school year section - principal
app.get('/school-years', async (req, res) => {
  const schoolYears = await SchoolYear.find();
  res.render('index', { schoolYears });
});

app.get('/create-school-year', (req, res) => {
  res.render('createSchoolYear');
});

app.post('/create-school-year', async (req, res) => {
  const schoolYear = new SchoolYear({
    year: req.body.year,
    primaryFees: req.body.primaryFees,
    secondaryFees: req.body.secondaryFees,
    term1Months: req.body.term1Months,
    term2Months: req.body.term2Months,
    term3Months: req.body.term3Months
  });
  try {
    await schoolYear.save();
    res.redirect('/school-years');
  } catch (err) {
    console.log(err);
    res.redirect('/create-school-year');
  }
});

app.get('/view-school-years', async (req, res) => {
  try {
    const schoolYears = await SchoolYear.find().sort({year: -1});
    res.render('viewSchoolYears', { schoolYears });
  } catch (err) {
    console.log(err);
    res.redirect('/');
  }
});


app.get('/school-year/edit/:id', async (req, res) => {
  const schoolYear = await SchoolYear.findById(req.params.id);
  res.render('editSchoolYear', { schoolYear });
});

app.post('/school-year/edit/:id', async (req, res) => {
  try {
    await SchoolYear.findByIdAndUpdate(req.params.id, {
      year: req.body.year,
      primaryFees: req.body.primaryFees,
      secondaryFees: req.body.secondaryFees,
      term1Months: req.body.term1Months,
      term2Months: req.body.term2Months,
      term3Months: req.body.term3Months
    });
    res.redirect('/school-years');
  } catch (err) {
    console.log(err);
    res.redirect(`/school-year/edit/${req.params.id}`);
  }
});

//principal delete year

app.delete('/school-year/delete/:id', async (req, res) => {
  try {
    await SchoolYear.findByIdAndDelete(req.params.id);
    res.redirect('/view-school-years');
  } catch (err) {
    console.log(err);
    res.redirect('/view-school-years');
  }
});




app.listen(3000, () => console.log('Server started on port 3000'));
