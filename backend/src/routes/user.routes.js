const Router = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jsonify = require('../helpers/jsonify');
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../s3');
const { v4: uuidv4 } = require('uuid');

const userRouter = new Router();

userRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id });

    if (!user) {
      const error = new Error('User not found');
      error.code = 404;
      throw error;
    }

    const { password, __v, ...sendUser } = jsonify(user);

    return res.send({ user: sendUser });
  } catch (err) {
    console.warn(err);
    res.status(err.code || 400).send({
      message: err.message || 'Error while fetching',
    });
  }
});

userRouter.get('/list/:id', async (req, res) => {
  try {
    const users = await User.find();

    if (!users) {
      const error = new Error('Users not found');
      error.code = 404;
      throw error;
    }
    const filteredUsers = jsonify(users).map((user) => {
      const { password, ...sendUser } = user;
      return sendUser;
    });

    return res.send({ users: filteredUsers });
  } catch (err) {
    console.warn(err);
    res.status(err.code || 400).send({
      message: err.message || 'Error while fetching',
    });
  }
});

userRouter.patch('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password: reqPassword, username } = req.body;

    if (email || username) {
      const candidate = await User.find({ $or: [{ email }, { username }] });

      if (candidate.length) {
        const byWhatExists =
          candidate[0].email === email ? 'email' : 'username';
        const error = new Error(
          `User with this ${byWhatExists} already exists`
        );
        error.code = 409;
        throw error;
      }
    }

    let hashedPassword;
    if (reqPassword) {
      hashedPassword = await bcrypt.hash(reqPassword, 8);
    }

    const user = await User.findOneAndUpdate(
      { _id: id },
      { email, password: hashedPassword, username },
      { new: true }
    );

    const { password, __v, ...sendUser } = jsonify(user);

    return res.send({ user: sendUser });
  } catch (err) {
    console.warn(err);
    res.status(err.code || 400).send({
      message: 'Error while update',
    });
  }
});

userRouter.patch('/info/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { avatar, age, gender, about, work, education, ages, lookingfor } =
      req.body;

    const user = await User.findOneAndUpdate(
      { _id: id },
      {
        avatar,
        age,
        gender,
        about,
        work,
        education,
        ages,
        lookingfor,
      },
      { new: true }
    );

    const { password, __v, ...sendUser } = jsonify(user);

    return res.send({ user: sendUser });
  } catch (err) {
    console.warn(err);
    res.status(err.code || 400).send({
      message: 'Error while update',
    });
  }
});

userRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await User.deleteOne({ _id: id });

    return res.send();
  } catch (err) {
    console.warn(err);
    res.status(err.code || 500).send({
      message: 'Error while delete',
    });
  }
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_AVATARS_BUCKET,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, `${uuidv4()}`);
    },
  }),
});

userRouter.post('/avatar/:id', upload.single('avatar'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id });

    if (user.avatar) {
      const filename = user.avatar.split('/').pop();
      if (filename) {
        s3.deleteObject(
          { Bucket: process.env.AWS_AVATARS_BUCKET, Key: filename },
          (err, data) => {
            if (err) {
              const error = new Error('Error while delete from bucket');
              error.code = 500;
              throw error;
            }
          }
        ).promise();
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      { avatar: req.file.location },
      { new: true }
    );

    return res.send({ user: updatedUser });
  } catch (err) {
    console.warn(err);
    res.status(err.code || 500).send({
      message: err.message || 'Error while uploading file',
    });
  }
});

module.exports = userRouter;
