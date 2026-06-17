import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Customer from "../models/Customer.js";
import Staff from "../models/Staff.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Try Admin first, then Customer
      let user = await Admin.findById(decoded.id).select("-password");
      if (!user) {
        user = await Customer.findById(decoded.id).select("-password_hash");
      }
      if (!user) {
        user = await Staff.findById(decoded.id).select("-password_hash");
      }

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      req.user.id = user._id.toString(); // normalize id access
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};