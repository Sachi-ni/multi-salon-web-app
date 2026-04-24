// routes/adminRoutes.js
router.put("/promote/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "super-admin") {
    return res.status(403).json({ message: "Not authorized" });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.role = "user-admin";
  await user.save();

  res.json({ message: "User promoted to admin", user });
});