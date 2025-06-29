require("./integrations/skinsPort")
require("dotenv").config();
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
require("./bot");
const routes = require("./routes/routes");

const app = express();

mongoose.connect("mongodb+srv://Fotih:RCZCG6OK8TuShQmH@cluster0.leruja1.mongodb.net/steam-auth");

app.use(cors());
app.use(express.json());

app.use('/api', routes)

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
