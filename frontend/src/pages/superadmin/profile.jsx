import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogOut, Edit } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "SA";

  return (
    <div className="max-w-[600px] mx-auto">
      <h2 className="text-lg font-extrabold text-white mb-5 flex items-center gap-2">
        👤 Admin Profile
      </h2>

      {/* Profile Card */}
      <Card className="mb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-[52px] h-[52px] rounded-xl bg-accent flex items-center justify-center text-xl font-black text-primary flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="font-extrabold text-[0.95rem] text-white">
              {user?.name || "Super Admin"}
            </div>
            <div className="text-xs text-muted-2">
              {user?.email || "admin@salonhub.com"}
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
        <Input
          label="Name"
          defaultValue={user?.name || "Super Admin"}
          readOnly
        />
        <Input
          label="Email"
          type="email"
          defaultValue={user?.email || "admin@salonhub.com"}
          readOnly
        />
        <Input
          label="Phone"
          type="tel"
          defaultValue={user?.phone || "+1234567890"}
          readOnly
        />

        <Button
          variant="primary"
          size="sm"
          icon={Edit}
          onClick={() => navigate("/editProfile")}
          className="mt-1"
        >
          Edit Profile
        </Button>
      </Card>

      {/* Logout */}
      <Button
        variant="danger"
        className="w-full justify-center"
        icon={LogOut}
        onClick={handleLogout}
      >
        Sign Out
      </Button>
    </div>
  );
};

export default Profile;