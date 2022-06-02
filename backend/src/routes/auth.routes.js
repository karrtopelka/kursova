const Router = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/auth.middleware');
const jsonify = require('../helpers/jsonify');

require('dotenv').config();

const authRouter = new Router();
const jwtSecretKey = process.env.SECRET_KEY_JWT;

authRouter.post(
  '/registration',
  [
    check('email', 'Uncorrect email').isEmail(),
    check(
      'password',
      'Uncorrect password (min length is 8, and max is 25)'
    ).isLength({
      min: 8,
      max: 25,
    }),
  ],
  async (req, res) => {
    try {
      const validation = validationResult(req);

      if (!validation.isEmpty()) {
        const error = new Error(
          `Validation failed. ${validation.errors[0].msg}`
        );
        error.code = 409;
        throw error;
      }

      const { email, password: enteredPassword, username } = req.body;

      const candidate = await User.find({ $or: [{ email }, { username }] });

      if (candidate.length) {
        const byWhatExists =
          candidate[0].email === email ? 'email' : 'username';
        const error = new Error(
          `Registration failed. User with this ${byWhatExists} already exists`
        );
        error.code = 409;
        throw error;
      }

      const hashedPassword = await bcrypt.hash(enteredPassword, 8);

      const user = new User({ email, password: hashedPassword, username });
      await user.save();

      const { password, __v, ...sendUser } = jsonify(user);

      const token = jwt.sign({ id: user.id }, jwtSecretKey, {
        expiresIn: '1hr',
      });

      return res.send({
        user: sendUser,
        token,
      });
    } catch (err) {
      console.warn(err);
      res.status(err.code || 400).send({
        message: err.message || 'Error while submitting registration',
      });
    }
  }
);

authRouter.post('/login', async (req, res) => {
  try {
    const { username, password: reqPassword } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      const error = new Error('User was not found');
      error.code = 404;
      throw error;
    }

    const isPasswordValid = bcrypt.compareSync(reqPassword, user.password);

    if (!isPasswordValid) {
      const error = new Error('Password is incorrect');
      error.code = 403;
      throw error;
    }

    const token = jwt.sign({ id: user.id }, jwtSecretKey, { expiresIn: '1hr' });

    const { password, __v, ...sendUser } = jsonify(user);

    return res.send({ token, user: sendUser });
  } catch (err) {
    console.warn(err);
    return res.status(err.code || 400).send({
      message: err.message || 'Error while submitting login',
    });
  }
});

authRouter.get('/auth', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.id });

    if (user) {
      const token = jwt.sign({ id: user.id }, jwtSecretKey, {
        expiresIn: '1h',
      });

      const { password, __v, ...sendUser } = jsonify(user);

      return res.send({ user: sendUser, token });
    }

    const error = new Error('You are not signed in');
    error.code = 401;
    throw error;
  } catch (err) {
    console.warn(err);
    res.status(err.code || 400).send({
      message: err.message || 'Error while authorizing',
    });
  }
});

authRouter.post('/many', async (req, res) => {
  try {
    const { users } = req.body;

    await Promise.all(
      users.map(
        async ({
          email,
          username,
          password,
          gender,
          avatar,
          about,
          age,
          ages,
          lookingfor,
          education,
          work,
        }) => {
          const hashedPassword = await bcrypt.hash(password, 8);

          const userr = new User({
            email,
            password: hashedPassword,
            username,
            gender,
            avatar,
            about,
            age,
            ages,
            lookingfor,
            education,
            work,
          });
          await userr.save();
        }
      )
    );

    return res.send({});
  } catch (err) {
    console.warn(err);
    res.status(err.code || 400).send({
      message: err.message || 'Error while submitting registration',
    });
  }
});

module.exports = authRouter;
