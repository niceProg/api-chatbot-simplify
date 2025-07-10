const express = require("express");
const serverless = require("serverless-http"); // <== penting
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT
app.use(cors());
app.use(bodyParser.json());

const geminiRoute = require("../routes/gemini");
app.use("/api", geminiRoute);

module.exports = serverless(app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
}));
