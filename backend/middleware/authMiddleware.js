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

      if (decoded.purpose) {
        return res.status(403).json({ message: "Complete account hardening before using this session" });
      }

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

      // A normal session must never bypass the first-login/reset password
      // hardening flow. This shared middleware protects every API route that
      // uses `protect`, not merely dashboard endpoints.
      if (user.mustChangePassword === true) {
        return res.status(403).json({ message: "Complete your required password change before using this session" });
      }

      req.user = {
        id: String(user._id),
        role: user.role,
        salon_id: user.salon_id ? String(user.salon_id) : null,
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

export const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.purpose) return next();

      let user = await Admin.findById(decoded.id).select("-password");
      if (!user) user = await Staff.findById(decoded.id).select("-password_hash");
      if (!user) user = await Customer.findById(decoded.id).select("-password_hash");

      if (user) {
        req.user = {
          id: String(user._id),
          role: user.role,
          salon_id: user.salon_id ? String(user.salon_id) : null,
        };
      }
    } catch (error) {
      // Ignored for optional protect
    }
  }
  next();
};

export const protectHardening = (purpose) => async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;
    if (!token) return res.status(401).json({ message: "Not authorized, no token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== purpose) return res.status(403).json({ message: "Invalid hardening token" });
    let user = await Admin.findById(decoded.id);
    if (!user) user = await Staff.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    if (purpose === "change-password" && user.mustChangePassword !== true) {
      return res.status(403).json({ message: "A password change is not required for this account" });
    }

    req.user = { id: String(user._id), role: user.role, salon_id: user.salon_id ? String(user.salon_id) : null };
    next();
  } catch {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};
