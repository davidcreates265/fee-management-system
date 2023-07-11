const mongoose = require('mongoose');

const SchoolYearSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true
  },
  primaryFees: {
    type: Number,
    required: true
  },
  secondaryFees: {
    type: Number,
    required: true
  },
  term1Months: {
    type: Number,
    required: true
  },
  term2Months: {
    type: Number,
    required: true
  },
  term3Months: {
    type: Number,
    required: true
  }
});

const SchoolYear = mongoose.model('SchoolYear', SchoolYearSchema);

module.exports = SchoolYear;
