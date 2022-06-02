const Router = require('express');
const Chat = require('../models/Chat');
const User = require('../models/User');
const chatMiddleware = require('../middlewares/chat.middleware');
const { Types } = require('mongoose');
const jsonify = require('../helpers/jsonify');

const chatRouter = new Router();

chatRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findOne({ _id: id });

    res.send({ chat: jsonify(chat) });
  } catch (err) {
    console.warn(err);
    res.status(err.code || 400).send({
      message: err.message || 'Error while fetching',
    });
  }
});

chatRouter.get('/ids/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const chatIds = await Chat.find({
      $expr: { $in: [Types.ObjectId(id), '$members'] },
    });
    const jChatIds = jsonify(chatIds).map(({ _id }) => _id);

    res.send({ chatIds: jChatIds });
  } catch (err) {
    console.warn(err);
    res.status(err.code || 400).send({
      message: err.message || 'Error while fetching',
    });
  }
});

chatRouter.get('/all/:id', async (req, res) => {
  try {
    const chatIds = await Chat.find({});
    const jChatIds = jsonify(chatIds).map(({ _id }) => _id);

    res.send({ chatIds: jChatIds });
  } catch (err) {
    console.warn(err);
    res.status(err.code || 400).send({
      message: err.message || 'Error while fetching',
    });
  }
});

chatRouter.get('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    const limitt = +limit * -1;

    const chat = await Chat.aggregate([
      {
        $match: {
          _id: Types.ObjectId(id),
        },
      },
      {
        $project: {
          _id: 1,
          members: 1,
          messages: {
            $cond: {
              if: {
                $gt: [
                  {
                    $size: '$messages',
                  },
                  0,
                ],
              },
              then: {
                $slice: [
                  '$messages',
                  limitt,
                  {
                    $size: '$messages',
                  },
                ],
              },
              else: '$messages',
            },
          },
          fullMessages: {
            $cond: {
              if: { $gte: [+limit, { $size: '$messages' }] },
              then: true,
              else: false,
            },
          },
        },
      },
    ]);
    const jChatMembers = jsonify(chat)[0].members.map((member) =>
      Types.ObjectId(member)
    );
    const chatusers = await User.aggregate([
      {
        $match: {
          $expr: {
            $in: ['$_id', jChatMembers],
          },
        },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          username: 1,
          avatar: 1,
          age: 1,
          gender: 1,
          about: 1,
          work: 1,
          education: 1,
          ages: 1,
          lookingfor: 1,
        },
      },
    ]);

    res.send({
      chatMessages: jsonify(chat)[0].messages,
      fullMessages: jsonify(chat)[0].fullMessages,
      members: chatusers,
    });
  } catch (err) {
    console.warn(err);
    res.status(err.code || 400).send({
      message: err.message || 'Error while fetching',
    });
  }
});

chatRouter.post('/create', chatMiddleware, async (req, res) => {
  try {
    const candidate = req.candidate;
    const { userid, chatuserid } = req.body;

    if (candidate) {
      res.send({ chat: candidate });
      return;
    }

    const chat = new Chat({ members: [userid, chatuserid] });
    await chat.save();

    res.send({ chat });
  } catch (err) {
    console.warn(err);
    res.status(err.code || 400).send({
      message: err.message || 'Error while fetching',
    });
  }
});

chatRouter.patch('/message/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, who } = req.body;

    const chat = await Chat.findOneAndUpdate(
      { _id: id },
      { $push: { messages: { message, who, when: new Date() } } },
      { new: true }
    );

    res.send({ chat: jsonify(chat) });
  } catch (err) {
    console.warn(err);
    res.status(err.code || 400).send({
      message: err.message || 'Error while fetching',
    });
  }
});

module.exports = chatRouter;
