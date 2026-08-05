import jwt from "jsonwebtoken";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      salon_id: user.salon_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

export default generateToken;