const express = require('express');
const mongoose = require('mongoose');

const authRouter = require('./routes/auth.routes');
const userRouter = require('./routes/user.routes');
const tinderRouter = require('./routes/tinder.routes');
const chatRouter = require('./routes/chat.routes');

const corsMiddleware = require('./middlewares/cors.middleware');

require('dotenv').config();

const app = express();
const PORT = process.env.SERVER_PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/tinder', tinderRouter);
app.use('/api/chat', chatRouter);

const start = async () => {
  try {
    const uri = process.env.MONGO_URL;
    await mongoose.connect(uri);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`server started on port ${PORT}`);
    });
  } catch (err) {
    console.warn(err);
  }
};

start();
