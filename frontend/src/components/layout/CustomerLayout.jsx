import React from "react";
import CustomerHeader from "./CustomerHeader";
import LandingNavbar from "../../pages/customer/landing-sections/LandingNavbar";
import clsx from "clsx";

const CustomerLayout = ({ children, useLandingNavbar = false }) => {

  return (
    <div className="min-h-screen bg-primary">
      {useLandingNavbar ? <LandingNavbar /> : <CustomerHeader />}
      <main className={clsx(
        "pt-header min-h-screen transition-[margin] duration-300 ease-in-out",
        "px-4 sm:px-5 pb-5"
      )}>
        <div className="py-5 max-w-[1500px] mx-auto animate-fade-up">
          {children}
        </div>
      </main>
    </div>
  );
};

export default CustomerLayout;