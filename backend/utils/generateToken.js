import jwt from "jsonwebtoken";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user?._id || user,
      role: user?.role,
      salon_id: user?.salon_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

export const generateHardeningToken = (user, purpose) => jwt.sign(
  {
    id: user._id,
    role: user.role,
    purpose,
  },
  process.env.JWT_SECRET,
  { expiresIn: "15m" }
);

export default generateToken;