const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5555;

app.use(cors());
app.use(bodyParser.json());

const geminiRoute = require("./routes/gemini");
app.use("/api", geminiRoute);

app.get("/", (req, res) => res.send("Gemini API running..."));

app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
});
