const mongoose = require('mongoose');

const realtorAvailabilitySchema = new mongoose.Schema({
  realtor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  availableDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports =  mongoose.model('RealtorAvailability', realtorAvailabilitySchema);