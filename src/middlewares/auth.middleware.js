const { verify } = require("../utils/jwt");

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const user = verify(token);
        if (user) {
          req.user = user;
          next();
        }
      }
    } else {
      res.status(401).json("Token is not defined");
    }
  } catch (err) {
    console.log(err)
    return res.status(401).json({
      message: "Unauthorized",
      error: err.message
    });
  }
}

module.exports = authMiddleware;