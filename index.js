//depedencias necesarias
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const archivoDB = require("./database");
const config = require("./utils/config");

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

//Ajustes Configiracion del puerto
//solicitar el puerto disponible
app.set("port", config.PORT);
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

app.use("/api/users", require("./routes/User.route"));
app.use("/api/enterprises", require("./routes/Enterprise.route"));

app.get("/api", (req, res) => {
  res.json({ message: "Welcome to my tesis." });
});

app.listen(app.get("port"), function () {
  console.log("Server is listening on port " + app.get("port"));
});
