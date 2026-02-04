const serverless = require("serverless-http");
require("dotenv").config();

const createApp = require("../app");

const app = createApp();
module.exports = serverless(app);
