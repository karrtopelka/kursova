const { Schema, model } = require('mongoose');

const User = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
  },
  age: {
    type: Number,
  },
  gender: {
    type: String,
  },
  about: {
    type: String,
  },
  work: {
    type: String,
  },
  education: {
    type: String,
  },
  ages: {
    type: {
      from: Number,
      to: Number,
    },
  },
  lookingfor: {
    type: String,
  },
});

module.exports = model('User', User);
