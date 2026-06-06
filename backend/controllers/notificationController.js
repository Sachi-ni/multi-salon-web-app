import Notification from "../models/Notification.js";

// GET /api/notifications
// Fetch all notifications for the logged-in user (Customer or Admin)
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient_id: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50); // Get recent 50
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/notifications/:id/read
// Mark a specific notification as read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient_id: req.user.id },
      { is_read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/notifications/read-all
// Mark all notifications as read for the logged in user
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient_id: req.user.id, is_read: false },
      { is_read: true }
    );
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
