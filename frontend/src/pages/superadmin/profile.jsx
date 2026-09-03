import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogOut, Edit } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { mediaUrl } from "../../utils/mediaUrl";
import api from "../../services/api";

const Profile = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user);

  useEffect(() => {
    api.get("/auth/profile")
      .then((response) => {
        setProfile(response.data);
        setUser(response.data);
      })
      .catch((error) => console.error("Could not load current profile", error));
  }, [setUser]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "SA";

  return (
    <div className="max-w-[600px] mx-auto">
      <h2 className="text-lg font-extrabold text-white mb-5 flex items-center gap-2">
        👤 Admin Profile
      </h2>

      {/* Profile Card */}
      <Card className="mb-5">
        <div className="flex items-center gap-3.5">
          <div className="relative w-[52px] h-[52px] rounded-xl bg-accent flex items-center justify-center text-xl font-black text-primary flex-shrink-0 overflow-hidden">
            <span aria-hidden="true">{initials}</span>
            {profile?.image && (
              <img
                src={mediaUrl(profile.image)}
                alt={`${profile?.name || "Admin"} profile`}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(event) => { event.currentTarget.style.display = "none"; }}
              />
            )}
          </div>
          <div>
            <div className="font-extrabold text-[0.95rem] text-white">
              {profile?.name || ""}
            </div>
            <div className="text-xs text-muted-2">
              {profile?.email || ""}
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
          value={profile?.name || ""}
          readOnly
        />
        <Input
          label="Email"
          type="email"
          value={profile?.email || ""}
          readOnly
        />
        <Input
          label="Phone"
          type="tel"
          value={profile?.phone || ""}
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
