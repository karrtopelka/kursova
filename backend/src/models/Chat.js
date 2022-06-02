const { Schema, model } = require('mongoose');

const Chat = new Schema({
  members: {
    type: [Schema.Types.ObjectId],
    required: true,
  },
  messages: {
    type: [
      {
        when: {
          type: Date,
          required: true,
        },
        who: {
          type: Schema.Types.ObjectId,
        },
        message: {
          type: String,
        },
      },
    ],
  },
});

module.exports = model('Chat', Chat);
