const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const REGION = process.env.AWS_BUCKET_REGION;

const s3 = new AWS.S3({
  region: REGION,
});

module.exports = s3;
