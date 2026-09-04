const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config();

// Global BigInt JSON serialization support
if (!BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    const intVal = Number(this);
    return Number.isSafeInteger(intVal) ? intVal : this.toString();
  };
}

const app = require("./app");
const pool = require("./config/db");
const redis = require("./config/redis");

const PORT = process.env.PORT || 5001;

app.locals.db = {
  connected: false,
  error: null,
};

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

pool
  .connect()
  .then((client) => {
    app.locals.db.connected = true;
    app.locals.db.error = null;
    client.release();
    console.log(" PostgreSQL Connected");
  })
  .catch((err) => {
    app.locals.db.connected = false;
    app.locals.db.error = err.message;
    console.error(" Database Connection Failed");
    console.error(err);
  });
