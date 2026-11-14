import Service from "../models/Service.js";
import ServiceCategory from "../models/ServiceCategory.js";
import Salon from "../models/Salon.js";
import Appointment from "../models/Appointment.js";
import Staff from "../models/Staff.js";
import Feedback from "../models/Feedback.js";
import { storeMedia } from "../utils/mediaStorage.js";

// ── Services CRUD ──

const attachRatings = async (services) => {
  const serviceIds = services.map((service) => service._id);
  if (serviceIds.length === 0) return services;
  const serviceIdStrings = serviceIds.map((id) => id.toString());

  const [legacyRatings, multipleRatings] = await Promise.all([
    Feedback.aggregate([
      {
        $match: {
          $expr: { $in: [{ $toString: "$service_id" }, serviceIdStrings] },
          $or: [{ serviceRatings: { $exists: false } }, { serviceRatings: { $size: 0 } }],
        },
      },
      {
        $group: {
          _id: "$service_id",
          total: { $sum: "$serviceRating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]),
    Feedback.aggregate([
      { $unwind: "$serviceRatings" },
      {
        $match: {
          $expr: { $in: [{ $toString: "$serviceRatings.service_id" }, serviceIdStrings] },
        },
      },
      {
        $group: {
          _id: "$serviceRatings.service_id",
          total: { $sum: "$serviceRatings.rating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const ratingTotals = new Map();
  [...legacyRatings, ...multipleRatings].forEach((rating) => {
    const key = rating._id.toString();
    const current = ratingTotals.get(key) || { total: 0, ratingCount: 0 };
    ratingTotals.set(key, {
      total: current.total + rating.total,
      ratingCount: current.ratingCount + rating.ratingCount,
    });
  });
  const ratingMap = new Map(
    [...ratingTotals.entries()].map(([key, rating]) => [
      key,
      {
        rating: Number((rating.total / rating.ratingCount).toFixed(1)) || 0,
        ratingCount: rating.ratingCount,
      },
    ])
  );

  return services.map((service) => ({
    ...service.toObject(),
    ...(ratingMap.get(service._id.toString()) || { rating: 0, ratingCount: 0 }),
  }));
};

export const createService = async (req, res) => {
  try {
    const { service_name, base_price, description, duration, category_id } = req.body || {};
    const salonId = req.user.role === "super-admin" ? (req.body?.salonId || req.body?.salon_id) : req.user.salon_id;
    if (!service_name || base_price === undefined || duration === undefined || !salonId || !req.file) {
      return res.status(400).json({ message: "service_name, base_price, duration, salon, and photo are required." });
    }
    if (base_price !== undefined && (
      (typeof base_price !== "number" && typeof base_price !== "string") ||
      (typeof base_price === "string" && !base_price.trim()) ||
      !Number.isFinite(Number(base_price))
    )) {
      return res.status(400).json({ message: "Price must be a number." });
    }
    if (duration !== undefined && (
      (typeof duration !== "number" && typeof duration !== "string") ||
      (typeof duration === "string" && !duration.trim()) ||
      !Number.isFinite(Number(duration))
    )) {
      return res.status(400).json({ message: "Duration must be a number." });
    }
    if (base_price !== undefined && Number(base_price) < 0) {
      return res.status(400).json({ message: "Price cannot be a negative value." });
    }
    if (duration !== undefined && Number(duration) <= 0) {
      return res.status(400).json({ message: "Duration must be greater than 0." });
    }

    if (!(await Salon.exists({ _id: salonId }))) {
      return res.status(404).json({ message: "Salon not found" });
    }
    if (category_id !== undefined && !(await ServiceCategory.exists({ _id: category_id }))) {
      return res.status(404).json({ message: "Service category not found" });
    }

    const photo = await storeMedia(req.file, "salonhub/services");
    const service = await Service.create({ service_name, base_price, description, duration, category_id, salon_id: salonId, photo });
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getServices = async (req, res) => {
  try {
    const { salonId } = req.query;

    const isAdmin = ["super-admin", "manager", "staff-admin"].includes(req.user?.role?.toLowerCase());
    const activeSalonIds = isAdmin
      ? null
      : await Salon.find({ status: { $not: /^deactivated$/i }, isPaused: { $ne: true } }).distinct("_id");
    const filter = salonId ? { salon_id: salonId } : {};
    if (!isAdmin) {
      filter.salon_id = salonId
        ? { $eq: salonId, $in: activeSalonIds }
        : { $in: activeSalonIds };
    }

    const services = await Service.find(filter)
      .populate("category_id")
      .populate("salon_id", "name location");
    res.set("Cache-Control", "no-store");
    res.json(await attachRatings(services));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const { service_name, base_price, description, duration, category_id, status } = req.body || {};
    if (base_price !== undefined && (
      (typeof base_price !== "number" && typeof base_price !== "string") ||
      (typeof base_price === "string" && !base_price.trim()) ||
      !Number.isFinite(Number(base_price))
    )) {
      return res.status(400).json({ message: "Price must be a number." });
    }
    if (duration !== undefined && (
      (typeof duration !== "number" && typeof duration !== "string") ||
      (typeof duration === "string" && !duration.trim()) ||
      !Number.isFinite(Number(duration))
    )) {
      return res.status(400).json({ message: "Duration must be a number." });
    }
    if (base_price !== undefined && Number(base_price) < 0) {
      return res.status(400).json({ message: "Price cannot be a negative value." });
    }
    if (duration !== undefined && Number(duration) <= 0) {
      return res.status(400).json({ message: "Duration must be greater than 0." });
    }
    if (status !== undefined && !["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ message: "Status must be either Active or Inactive." });
    }

    const existing = await Service.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Service not found" });
    }
    if (
      req.user.role !== "super-admin" &&
      existing.salon_id?.toString() !== req.user.salon_id?.toString()
    ) {
      return res.status(403).json({ message: "Not authorized for this salon" });
    }

    const updateData = {};
    if (service_name !== undefined) updateData.service_name = service_name;
    if (base_price !== undefined) updateData.base_price = base_price;
    if (description !== undefined) updateData.description = description;
    if (req.file) updateData.photo = await storeMedia(req.file, "salonhub/services");
    if (duration !== undefined) updateData.duration = duration;
    if (category_id !== undefined) {
      if (!(await ServiceCategory.exists({ _id: category_id }))) {
        return res.status(404).json({ message: "Service category not found" });
      }
      updateData.category_id = category_id;
    }
    if (status !== undefined) updateData.status = status;
    if (req.user.role === "super-admin" && (req.body?.salonId !== undefined || req.body?.salon_id !== undefined)) {
      const salonId = req.body.salonId || req.body.salon_id;
      if (!(await Salon.exists({ _id: salonId }))) {
        return res.status(404).json({ message: "Salon not found" });
      }
      updateData.salon_id = salonId;
    }

    const service = await Service.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const existing = await Service.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Service not found" });
    }
    if (
      req.user.role !== "super-admin" &&
      existing.salon_id?.toString() !== req.user.salon_id?.toString()
    ) {
      return res.status(403).json({ message: "Not authorized for this salon" });
    }
    if (
      await Appointment.exists({
        $or: [{ service_id: existing._id }, { service_ids: existing._id }],
      }) ||
      await Staff.exists({ services: existing._id })
    ) {
      return res.status(409).json({
        message: "Cannot delete service: it has linked appointments or staff",
      });
    }
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Service Categories ──

export const getCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.find().sort({ category_name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { category_name } = req.body;
    if (typeof category_name !== "string" || !category_name.trim()) {
      return res.status(400).json({ message: "Category name is required." });
    }
    const category = await ServiceCategory.create({ category_name });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};