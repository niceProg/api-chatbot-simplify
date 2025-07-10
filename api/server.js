const express = require("express");
const serverless = require("serverless-http"); // <== penting
const cors = require("cors");
const bodyParser = require("body-parser");
if (process.env.NODE_ENV !== "production") {
     require("dotenv").config();
}


const app = express();
// const PORT = process.env.PORT        //Untuk Development
app.use(cors());
app.use(bodyParser.json());

const geminiRoute = require("../routes/gemini");
app.use("/", geminiRoute);

module.exports = serverless(app);

// module.exports = serverless(app.listen(PORT, () => {
//      console.log(`Server running on port ${PORT}`);
// }));
