const path = require("path");
const Datastore = require("nedb-promises");

const users = Datastore.create({
  filename: path.join(__dirname, "data", "users.db"),
  autoload: true,
  timestampData: true
});

const loginAttempts = Datastore.create({
  filename: path.join(__dirname, "data", "login_attempts.db"),
  autoload: true,
  timestampData: true
});

users.ensureIndex({ fieldName: "mobile", unique: true });

module.exports = { users, loginAttempts };
