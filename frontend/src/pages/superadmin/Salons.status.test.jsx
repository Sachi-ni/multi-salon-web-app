import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import Salons from "./Salons";
import { getSalons, updateSalonStatus } from "../../services/salonService";

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: null }),
}));

jest.mock("../../services/salonService", () => ({
  getSalons: jest.fn(),
  getSalon: jest.fn(),
  updateSalon: jest.fn(),
  updateSalonStatus: jest.fn(),
  deleteSalon: jest.fn(),
}));

const activeSalon = { _id: "salon-1", name: "QA Salon", status: "active" };
const deactivatedSalon = { ...activeSalon, status: "deactivated" };

const openStatusMenu = (salonName) => {
  const card = screen.getByText(salonName).closest(".group");
  fireEvent.click(within(card).getAllByRole("button")[0]);
};

beforeEach(() => {
  jest.clearAllMocks();
  getSalons.mockResolvedValue({ data: [activeSalon] });
  updateSalonStatus.mockResolvedValue({ data: {} });
});

test("shows the matching status action for active and deactivated salons", async () => {
  const { unmount } = render(<Salons />);

  await screen.findByText("QA Salon");
  openStatusMenu("QA Salon");
  expect(screen.getByRole("button", { name: "Deactivate Salon" })).toBeTruthy();

  unmount();
  getSalons.mockResolvedValue({ data: [deactivatedSalon] });
  render(<Salons />);
  await waitFor(() => expect(screen.getByText("Deactivated")).toBeTruthy());
  openStatusMenu("QA Salon");
  expect(screen.getByRole("button", { name: "Activate Salon" })).toBeTruthy();
});

test("deactivates with the selected deactivation type", async () => {
  render(<Salons />);
  await screen.findByText("QA Salon");
  openStatusMenu("QA Salon");
  fireEvent.click(screen.getAllByRole("button", { name: "Deactivate Salon" }).at(-1));
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "permanent" } });
  fireEvent.click(screen.getAllByRole("button", { name: "Deactivate Salon" }).at(-1));

  await waitFor(() => expect(updateSalonStatus).toHaveBeenCalledWith("salon-1", {
    status: "deactivated",
    deactivationType: "permanent",
  }));
});

test("activates a deactivated salon with active status", async () => {
  getSalons.mockResolvedValue({ data: [deactivatedSalon] });
  render(<Salons />);
  await screen.findByText("Deactivated");
  openStatusMenu("QA Salon");
  fireEvent.click(screen.getAllByRole("button", { name: "Activate Salon" }).at(-1));
  fireEvent.click(screen.getAllByRole("button", { name: "Activate Salon" }).at(-1));

  await waitFor(() => expect(updateSalonStatus).toHaveBeenCalledWith("salon-1", {
    status: "active",
  }));
});

test("shows the server message when the status request fails", async () => {
  updateSalonStatus.mockRejectedValue({ response: { data: { message: "Status update denied" } } });
  render(<Salons />);
  await screen.findByText("QA Salon");
  openStatusMenu("QA Salon");
  fireEvent.click(screen.getAllByRole("button", { name: "Deactivate Salon" }).at(-1));
  fireEvent.click(screen.getAllByRole("button", { name: "Deactivate Salon" }).at(-1));

  expect(await screen.findByText("Status update denied")).toBeTruthy();
});
