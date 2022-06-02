const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    next();
  }

  try {
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
      const error = new Error('Authorization failed.');
      error.code = 500;
      throw error;
    }

    const decoded = jwt.verify(
      token.replace(/^"(.*)"$/, '$1'),
      process.env.SECRET_KEY_JWT
    );

    req.user = decoded;

    next();
  } catch (err) {
    console.warn(err);
    return res
      .status(err.code || 500)
      .json({ message: err.message || 'Error in middleware' });
  }
};
