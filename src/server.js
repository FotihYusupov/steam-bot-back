require("./integrations/skinsPort")
require("dotenv").config();
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
require("./bot");
const routes = require("./routes/routes");

const app = express();

mongoose.connect("mongodb://localhost:27017/steam-auth");

app.use(cors());
app.use(express.json());

app.use('/api', routes)

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
