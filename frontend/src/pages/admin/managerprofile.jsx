import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogOut, Edit } from "lucide-react";
import clsx from "clsx";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { getSalon } from "../../services/salonService";

const ManagerProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { salonId } = useParams();
  const [salonName, setSalonName] = useState(user?.salonName || "");
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (salonId) {
      getSalon(salonId)
        .then((res) => {
          setSalonName(res.data.name);
        })
        .catch((err) => {
          console.error("Failed to fetch salon name", err);
          setSalonName("Not Assigned");
        });
    }
  }, [salonId]);

  const canEdit = user?.role === "manager";

  const slides = [
    {
      title: "Contact",
      subtitle: "Salon contact details",
      content: (
        <div className="space-y-2 text-sm text-muted-2">
          <p><span className="font-semibold text-white">Phone:</span> {user?.phone || "Not provided"}</p>
          <p><span className="font-semibold text-white">Email:</span> {user?.email || "Not provided"}</p>
          <p><span className="font-semibold text-white">Salon:</span> {salonName || "Loading..."}</p>
        </div>
      ),
    },
    {
      title: "Vision",
      subtitle: "Salon mission and direction",
      content: (
        <p className="text-sm text-muted-2">
          The salon vision is your statement of purpose. Keep it inspiring, customer-focused, and aligned with your services.
        </p>
      ),
    },
    {
      title: "Details",
      subtitle: "Editable profile fields",
      content: (
        <div className="space-y-2 text-sm text-muted-2">
          <p>Only salon managers can edit phone, address, and vision.</p>
          <p>Salon name and manager details are read-only in this module.</p>
        </div>
      ),
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  return (
    <div className="max-w-[600px] mx-auto">

      {/* Profile Card */}
      <Card className="mb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-[52px] h-[52px] rounded-xl bg-accent flex items-center justify-center text-xl font-black text-primary flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="font-extrabold text-[0.95rem] text-white">
              {user?.name || "Admin User"}
            </div>
            <div className="text-xs text-muted-2">
              {user?.email || "manager@salonhub.com"}
            </div>
            <div className="text-xs text-muted-2 mt-1">
              Salon: {salonName || "Loading..."}
            </div>
            <div className="text-[0.65rem] text-accent font-bold mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse-dot" />
              Online
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Fields */}
      <Card className="mb-5">
        <Input label="Name" defaultValue={user?.name || "Admin User"} readOnly />
        <Input
          label="Email"
          type="email"
          defaultValue={user?.email || "manager@salonhub.com"}
          readOnly
        />
        <Input
          label="Phone"
          type="tel"
          defaultValue={user?.phone || "Not provided"}
          readOnly
        />
        <Input
          label="SalonName"
          defaultValue={salonName || "salon"}
          readOnly
        />

        {canEdit ? (
          <Button
            variant="primary"
            size="sm"
            icon={Edit}
            onClick={() => navigate("/editProfile")}
            className="mt-1"
          >
            Edit Profile
          </Button>
        ) : (
          <div className="mt-3 text-sm text-muted-2">
            Only salon managers can edit this profile.
          </div>
        )}
      </Card>

      {/* Logout */}
      <Button variant="danger" className="w-full justify-center" icon={LogOut} onClick={handleLogout}>
        Sign Out
      </Button>
    </div>
  );
};

export default ManagerProfile;