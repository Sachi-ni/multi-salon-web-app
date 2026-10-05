import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AddSalon from "./AddSalon";
import { createSalon } from "../../services/salonService";

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock("../../services/salonService", () => ({
  createSalon: jest.fn(),
}));

const fillRequiredFields = (openTime, closeTime) => {
  fireEvent.change(screen.getByPlaceholderText("Enter salon name"), { target: { value: "QA Salon" } });
  fireEvent.change(screen.getAllByPlaceholderText("0771234567 or +94771234567")[0], { target: { value: "0771234567" } });
  fireEvent.change(screen.getByPlaceholderText("Enter address"), { target: { value: "Colombo" } });
  fireEvent.change(screen.getByPlaceholderText("Enter manager full name"), { target: { value: "QA Manager" } });
  fireEvent.change(screen.getByPlaceholderText("Enter manager email"), { target: { value: "manager@gmail.com" } });
  fireEvent.change(screen.getAllByPlaceholderText("0771234567 or +94771234567")[1], { target: { value: "0777654321" } });
  fireEvent.change(screen.getByPlaceholderText("Enter manager password"), { target: { value: "Strong!Pass1" } });

  const [openingTime, closingTime] = screen.getAllByRole("combobox");
  fireEvent.change(openingTime, { target: { value: openTime } });
  fireEvent.change(closingTime, { target: { value: closeTime } });
};

beforeEach(() => {
  createSalon.mockResolvedValue({ data: {} });
});

test("blocks submission when closing time is earlier than opening time", () => {
  render(<AddSalon />);
  fillRequiredFields("19:00", "09:00");

  fireEvent.click(screen.getByRole("button", { name: "Add Salon" }));

  expect(screen.getByText("Opening time must be earlier than closing time.")).toBeTruthy();
  expect(createSalon).not.toHaveBeenCalled();
});

test("submits selected operating hours for valid salon details", async () => {
  render(<AddSalon />);
  fillRequiredFields("09:00", "18:00");

  fireEvent.click(screen.getByRole("button", { name: "Add Salon" }));

  await waitFor(() => expect(createSalon).toHaveBeenCalledTimes(1));
  const submitted = createSalon.mock.calls[0][0];
  expect(submitted.get("open_time")).toBe("09:00");
  expect(submitted.get("close_time")).toBe("18:00");
});