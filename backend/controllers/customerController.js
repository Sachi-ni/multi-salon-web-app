import Customer from "../models/Customer.js";

export const createCustomer = async (req, res) => {
  const customer = await Customer.create(req.body);
  res.status(201).json(customer);
};

export const getCustomers = async (req, res) => {
  const customers = await Customer.find();
  res.json(customers);
};

export const getCustomerById = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  res.json(customer);
};

export const updateCustomer = async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(customer);
};

export const deleteCustomer = async (req, res) => {
  await Customer.findByIdAndDelete(req.params.id);
  res.json({ message: "Customer deleted" });
};