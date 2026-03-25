const jwt = require("jsonwebtoken");

const SECRET_KEY = "mysecretkey"; // move to .env later

function verifyToken(req, res, next) {
  try {
    const header = req.headers["authorization"];

    if (!header) {
      return res.status(403).json({ message: "No token provided" });
    }

    // Format: Bearer TOKEN
    const token = header.split(" ")[1];

    if (!token) {
      return res.status(403).json({ message: "Invalid token format" });
    }

    const decoded = jwt.verify(token, SECRET_KEY);

    req.user = decoded; // attach user data
    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = verifyToken;