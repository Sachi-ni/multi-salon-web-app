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

      let user = await Admin.findById(decoded.id).select("-password");
      if (!user) {
        user = await Staff.findById(decoded.id).select("-password_hash");
      }
      if (!user) {
        user = await Customer.findById(decoded.id).select("-password_hash");
      }

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = {
        id: user._id,
        role: user.role,
        salon_id: user.salon_id,
      };

      // DEBUG: log auth user role for permission troubleshooting
      console.log("[authMiddleware] decoded.id=", decoded.id);
      console.log("[authMiddleware] decoded.role=", decoded.role);
      console.log("[authMiddleware] req.user.role=", req.user.role);
      console.log("[authMiddleware] req.user.salon_id=", req.user.salon_id);

      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};