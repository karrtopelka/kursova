const { Schema, model } = require('mongoose');

const Tinder = new Schema({
  when: {
    type: Date,
    required: true,
  },
  who: {
    type: Schema.Types.ObjectId,
  },
  liked: {
    type: Schema.Types.ObjectId,
  },
  likedback: {
    type: Boolean,
  },
});

module.exports = model('Tinder', Tinder);
