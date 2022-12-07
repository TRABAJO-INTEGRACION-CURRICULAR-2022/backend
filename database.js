const mongoose = require("mongoose");
const config = require("./utils/config");
mongoose.connect(config.MONGODB_URI);

const objetobd = mongoose.connection;

objetobd.on("connected", () => {
  console.log("conexión correcta a Mongo db");
});

objetobd.on("error", () => {
  console.log("error en la conexión de mongo db");
});

module.exports = mongoose;
