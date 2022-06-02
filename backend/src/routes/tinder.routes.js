const Router = require('express');
const User = require('../models/User');
const jsonify = require('../helpers/jsonify');
const Tinder = require('../models/Tinder');
const { Types } = require('mongoose');

const tinderRouter = new Router();

tinderRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id });

    if (!user) {
      const error = new Error('User not found');
      error.code = 404;
      throw error;
    }

    const jUser = jsonify(user);

    const tinders = await Tinder.find({
      $or: [{ who: id }, { liked: id }],
      likedback: true,
    });
    const jTinders = jsonify(tinders).map((tinder) => [
      tinder.who,
      tinder.liked,
    ]);

    // convert jTinders to one dimensional array
    const tinderArray = jTinders.reduce((acc, curr) => {
      acc.push(...curr);
      return acc;
    }, []);
    // remove duplicates
    const uniqueTinderArray = [...new Set(tinderArray)];
    uniqueTinderArray.push(id);

    const tinderList = await User.find({
      _id: { $nin: uniqueTinderArray },
      gender: jUser.lookingfor,
      age: { $gte: jUser.ages.from, $lte: jUser.ages.to },
      lookingfor: jUser.gender,
      'ages.from': {
        $lte: jUser.age,
      },
      'ages.to': {
        $gte: jUser.age,
      },
    });

    const filteredTinderUsers = jsonify(tinderList).map((user) => {
      const { password, ...sendUser } = user;
      return sendUser;
    });

    return res.send({ tinderUsers: filteredTinderUsers });
  } catch (err) {
    console.warn(err);
    res.status(err.code || 400).send({
      message: err.message || 'Error while fetching',
    });
  }
});

tinderRouter.get('/sent/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const likesSent = await Tinder.find({ who: id, likedback: false });
    const jLikesSentIds = jsonify(likesSent)
      .reverse()
      .map((tinderPerson) => tinderPerson.liked);

    const tinderPersons = await User.find({ _id: { $in: jLikesSentIds } });
    const jTinderPersons = jsonify(tinderPersons);

    let a = [];
    for (let i = 0; i < jLikesSentIds.length; i++) {
      for (let j = 0; j < jTinderPersons.length; j++) {
        if (jLikesSentIds[i] === jTinderPersons[j]._id) {
          a.push(jTinderPersons[j]);
        }
      }
    }

    const mTinderPersons = jsonify(a).map(
      ({
        username,
        avatar,
        age,
        gender,
        about,
        work,
        education,
        ages,
        lookingfor,
      }) => ({
        username,
        avatar,
        age,
        gender,
        about,
        work,
        education,
        ages,
        lookingfor,
      })
    );

    return res.send({ tinderUsers: mTinderPersons });
  } catch (err) {
    console.warn(err);
    res.status(err.code || 400).send({
      message: err.message || 'Error while fetching',
    });
  }
});

tinderRouter.post('/like/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { who } = req.body;

    const ifAlreadyLiked = await Tinder.findOne({ who, liked: id });

    if (!ifAlreadyLiked) {
      const like = new Tinder({
        when: new Date(),
        who: id,
        liked: who,
        likedback: false,
      });
      await like.save();

      res.send({});
    } else {
      const { _id } = jsonify(ifAlreadyLiked);

      await Tinder.updateOne({ _id }, { likedback: true }, { new: true });

      res.send({ message: 'Match' });
    }
  } catch (err) {
    console.warn(err);
    res.status(err.code || 400).send({
      message: err.message || 'Error while fetching',
    });
  }
});

tinderRouter.get('/tinder/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const matches = await Tinder.aggregate([
      {
        $match: {
          $or: [
            {
              who: Types.ObjectId(id),
            },
            {
              liked: Types.ObjectId(id),
            },
          ],
          likedback: true,
        },
      },
      {
        $set: {
          fu: Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'who',
          foreignField: '_id',
          as: 'likedbackuser',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'liked',
          foreignField: '_id',
          as: 'likedbackusertwo',
        },
      },
      {
        $unwind: {
          path: '$likedbackuser',
        },
      },
      {
        $unwind: {
          path: '$likedbackusertwo',
        },
      },
      {
        $addFields: {
          lbu: ['$likedbackuser', '$likedbackusertwo'],
        },
      },
      {
        $unset: ['likedbackuser', 'likedbackusertwo'],
      },
      {
        $project: {
          _id: 1,
          when: 1,
          likedbackuser: {
            $cond: {
              if: {
                $eq: [
                  '$fu',
                  {
                    $first: '$lbu._id',
                  },
                ],
              },
              then: {
                $last: '$lbu',
              },
              else: {
                $first: '$lbu',
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          when: 1,
          likedbackuser: {
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
      },
    ]);

    const jMatches = jsonify(matches);

    res.send({ matches: jMatches });
  } catch (err) {
    console.warn(err);
    res.status(err.code || 400).send({
      message: err.message || 'Error while fetching',
    });
  }
});

module.exports = tinderRouter;
