import React from "react";
import { useNavigate } from "react-router-dom";

const LoginHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="h-header bg-surface/90 backdrop-blur-glass border-b border-border flex items-center px-5 gap-3 fixed top-0 left-0 right-0 z-[200]">
      {/* Logo */}
      <div className="flex items-center gap-2 text-lg font-black text-accent whitespace-nowrap tracking-tight">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-sm font-black text-primary flex-shrink-0">
          S
        </div>
        <span className="text-white">Salon</span>Hub
      </div>

      {/* Badge */}
      <div className="bg-accent-muted border border-accent/35 text-accent px-2.5 py-0.5 rounded-full text-[0.6rem] font-extrabold tracking-widest uppercase">
        Welcome Back
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Login Button */}
      <button
        onClick={() => navigate("/login")}
        className="px-5 py-2 bg-accent text-primary rounded-lg text-xs font-extrabold tracking-wide uppercase hover:bg-accent-hover hover:shadow-glow transition-all duration-200 hover:-translate-y-px"
      >
        Login
      </button>
    </header>
  );
};

export default LoginHeader;