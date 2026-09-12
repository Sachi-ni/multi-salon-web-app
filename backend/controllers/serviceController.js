import Service from "../models/Service.js";
import ServiceCategory from "../models/ServiceCategory.js";
import Salon from "../models/Salon.js";

// ── Services CRUD ──

export const createService = async (req, res) => {
  try {
    const { service_name, base_price, description, duration, category_id } = req.body;
    const salonId = req.user.role === "super-admin" ? (req.body.salonId || req.body.salon_id) : req.user.salon_id;
    if (!service_name || base_price === undefined || duration === undefined || !salonId) {
      return res.status(400).json({ message: "service_name, base_price, duration, and salon are required." });
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

    const service = await Service.create({ service_name, base_price, description, duration, category_id, salon_id: salonId });
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getServices = async (req, res) => {
  try {
    const { salonId } = req.query;

    const isAdmin = ["super-admin", "manager"].includes(req.user?.role?.toLowerCase());
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
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const { service_name, base_price, description, duration, category_id, status } = req.body;
    if (base_price !== undefined && Number(base_price) < 0) {
      return res.status(400).json({ message: "Price cannot be a negative value." });
    }
    if (duration !== undefined && Number(duration) <= 0) {
      return res.status(400).json({ message: "Duration must be greater than 0." });
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
    if (duration !== undefined) updateData.duration = duration;
    if (category_id !== undefined) {
      if (!(await ServiceCategory.exists({ _id: category_id }))) {
        return res.status(404).json({ message: "Service category not found" });
      }
      updateData.category_id = category_id;
    }
    if (status !== undefined) updateData.status = status;
    if (req.user.role === "super-admin" && (req.body.salonId !== undefined || req.body.salon_id !== undefined)) {
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
    const category = await ServiceCategory.create({ category_name });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};