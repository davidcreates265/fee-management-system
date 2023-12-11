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

// Connecting to MongoDB 
mongoose.connect("mongodb+srv://davidcreatesmw:mongoCONNECTTESTING..@cluster0.ovd5cfm.mongodb.net/feeManagementSystemDB", { useNewUrlParser: true, useUnifiedTopology: true })
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

      // Redirecting user to the appropriate dashboard based on their role
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
  const userName = req.session.user.email;
  if (user && user.role === 'principal') {
    res.render('dashboard_principal.ejs' , { userName });
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
    // Checking if user with same email already exists in database
    const userExists = await User.findOne({ email: email });
    if (userExists) {
      return res.render('create-user', { error: 'User already exists with this email' });
    }
    // Creating a new user object
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
    res.redirect('/create-school-year');
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


// Defining the schema for the student model
const studentSchema = new mongoose.Schema({
  name: String,
  age: Number,
  gender: String,
  level: String,
  class: String,
  fees: Number,
  status: String,
  paid_amount: Number,
  date_paid: Date,
});

// Creating a model based on the schema
const Student = mongoose.model('Student', studentSchema);

app.get('/add-new-student', (req, res) => {
  res.render('addnewStudent');
});

app.post('/add-new-student', (req, res) => {
  const newStudent = new Student({
    name: req.body.name,
    age: req.body.age,
    gender: req.body.gender,
    level: req.body.level,
    class: req.body.class,
    fees: req.body.fees,
    status: req.body.status,
    paid_amount: req.body.paidAmount,
    date_paid: req.body.paymentDate,
  });

  newStudent.save();
  res.redirect('/add-new-student');

});


// Routes
app.get('/generate-report', (req, res) => {
  res.render('generate-report', { report: undefined });
});


// Function for generating reports
function generateReport(students) {
  let report = 'Report:\n\n';

  students.forEach((student, index) => {
    report += `Student ${index + 1}:\n`;
    report += `Name: ${student.name}\n`;
    report += `Level: ${student.level}\n`;
    report += `Class: ${student.class}\n`;
    report += `Fees: ${student.fees}\n`;
    report += `Status: ${student.status}\n\n`;
    report += `Status: ${student.paidAmount}\n\n`;
    report += `Status: ${student.paymentDate}\n\n`;

  });

  return report;
}

app.post('/generate-report', async (req, res) => {
  try {
    const { level, studentClass, status } = req.body; // Destructuring the values directly from req.body

    console.log(level, studentClass, status); // debugging purposes

    let query = {};

    if (level) {
      query.level = level;
    }

    if (studentClass) {
      query.class = studentClass; 
    }

    if (status) {
      query.status = status;
    }

    const students = await Student.find(query);

    if (students.length === 0) {
      return res.render('generate-report', { report: '', level, students: [] });
    }

    const report = generateReport(students);

    res.render('generate-report', { report, level, students });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while generating the report.');
  }
});





// Download report
app.get('/download-report', (req, res) => {
  const report = req.query.report;

  // Setting the content type as plain text
  res.set('Content-Type', 'text/plain');

  // Setting the content disposition header to trigger a download
  res.set('Content-Disposition', 'attachment; filename="report.txt"');

  // Sending the report as the response
  res.send(report);
});


app.get('/edit-student/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    res.render('editStudent', { student });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching student data.');
  }
});


app.post('/edit-student/:id', async (req, res) => {
  try {
    const { name, age, gender, level, studentClass, fees, status, paidAmount, paymentDate } = req.body;
    
    // Fetchong the student from the database by ID
    const student = await Student.findById(req.params.id);

    // Calculating the new fees based on the paidAmount and the previous fees
    const newFees = student.fees - paidAmount;

    // Updating the student's information, including the "fees" field
    await Student.findByIdAndUpdate(req.params.id, {
      name,
      age,
      gender,
      level,
      class: studentClass,
      fees: newFees, // Updating the fees field
      status,
      paid_amount: paidAmount,
      date_paid: paymentDate
    });

    res.redirect('/payments'); // Redirecting to the payments page after saving changes
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while updating student data.');
  }
});


app.get('/payments', async (req, res) => {
  try {
    const students = await Student.find(); // Fetching all students from the database
    res.render('payments', { students }); // Passing the students data to the view
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching student data.');
  }
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.get('/payments', (req, res) => {
  res.render('payments');
});


app.listen(port, function() {
  console.log("Server has started successfully");
});