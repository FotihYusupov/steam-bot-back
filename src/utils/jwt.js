const jwt = require("jsonwebtoken");
exports.sign = (payload) => jwt.sign(payload, process.env.SECRET_KEY);
exports.verify = (payload) => jwt.verify(payload, process.env.SECRET_KEY);