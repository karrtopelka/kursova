const Chat = require('../models/Chat');
const { Types } = require('mongoose');
const jsonify = require('../helpers/jsonify');

module.exports = async (req, res, next) => {
  try {
    const { userid, chatuserid } = req.body;

    const candidate = await Chat.findOne({
      $expr: {
        $and: [
          { $in: [Types.ObjectId(userid), '$members'] },
          { $in: [Types.ObjectId(chatuserid), '$members'] },
        ],
      },
    });

    if (candidate) {
      req.candidate = jsonify(candidate);
      next();
    }

    next();
  } catch (err) {
    console.warn(err);
    return res
      .status(err.code || 500)
      .json({ message: err.message || 'Error in middleware' });
  }
};
