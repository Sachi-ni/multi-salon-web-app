export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const userRole = req.user?.role?.toString()?.toLowerCase();
    const allowedRoles = roles.map((r) => r.toString().toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }

    next();
  };
};

export const requireRole = (roles) => {
  const allowedRoles = roles.map((role) => role.toLowerCase());
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role?.toLowerCase())) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }
    next();
  };
};
