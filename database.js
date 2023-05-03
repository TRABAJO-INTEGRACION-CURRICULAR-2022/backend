const mongoose = require("mongoose");
const config = require("./utils/config");
//mongoose.connect(config.MONGODB_URI);
mongoose.connect("mongodb://localhost:27017/tesis");
//mongoose.connect("mongodb+srv://tesis:Tesis123@cluster0.gzew6uq.mongodb.net/?retryWrites=true&w=majority");

const objetobd = mongoose.connection;

objetobd.on("connected", () => {
  console.log("conexión correcta a Mongo db");
});

objetobd.on("error", () => {
  console.log("error en la conexión de mongo db");
});

module.exports = mongoose;
