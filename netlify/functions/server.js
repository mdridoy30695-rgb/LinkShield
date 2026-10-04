const serverless = require('serverless-http');
const app = require('../../server');

// Wrap Express app as Netlify serverless function
module.exports.handler = serverless(app);
