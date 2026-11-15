import React from "react";
import {
  Scissors,
  Sparkles,
  Palette,
  Paintbrush,
  GraduationCap,
  Waves,
  Droplets,
  Flower2,
  Crown,
  Hand,
  Feather,
  Wind,
} from "lucide-react";

/* ─── Custom Barber Clipper / Trimmer Icon (for Beard Trimming & Grooming) ─── */
export const TrimmerIcon = ({ className = "w-6 h-6", strokeWidth = 2, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Clipper blade teeth */}
    <path d="M6 3h12l-1 5H7L6 3z" />
    <line x1="9" y1="3" x2="9" y2="6" />
    <line x1="12" y1="3" x2="12" y2="6" />
    <line x1="15" y1="3" x2="15" y2="6" />
    {/* Trimmer body handle */}
    <path d="M7.5 8v10a2.5 2.5 0 0 0 2.5 2.5h4a2.5 2.5 0 0 0 2.5-2.5V8" />
    <line x1="10" y1="12" x2="14" y2="12" />
    <circle cx="12" cy="16" r="1" fill="currentColor" />
  </svg>
);

/**
 * Returns the most relevant Lucide or custom icon component for any salon service.
 * Matches by service name or category keywords.
 */
export const getServiceIcon = (serviceName = "", categoryName = "") => {
  const text = `${serviceName} ${categoryName}`.toLowerCase();

  // 1. Beard & Facial Hair Grooming
  if (
    text.includes("beard") ||
    text.includes("shave") ||
    text.includes("mustache") ||
    (text.includes("trimming") && !text.includes("hair"))
  ) {
    return TrimmerIcon;
  }

  // 2. School / Student / Kids Haircut
  if (
    text.includes("school") ||
    text.includes("student") ||
    text.includes("kid") ||
    text.includes("child") ||
    text.includes("teen")
  ) {
    return GraduationCap;
  }

  // 3. Hair Color with specific shade (Black, Blonde, Highlights, Tint)
  if (
    text.includes("black") ||
    text.includes("highlight") ||
    text.includes("tint") ||
    text.includes("bleach") ||
    text.includes("dye") ||
    text.includes("streak")
  ) {
    return Paintbrush;
  }

  // 4. General Hair Coloring / Balayage / Ombre
  if (
    text.includes("color") ||
    text.includes("colour") ||
    text.includes("balayage") ||
    text.includes("ombre")
  ) {
    return Palette;
  }

  // 5. Massage & Body Therapy
  if (
    text.includes("massage") ||
    text.includes("body") ||
    text.includes("therapy") ||
    text.includes("relax")
  ) {
    return Waves;
  }

  // 6. Facial Treatments & Skin Glow
  if (
    text.includes("facial") ||
    text.includes("face") ||
    text.includes("glow") ||
    text.includes("peel")
  ) {
    return Sparkles;
  }

  // 7. Clean Up / Deep Cleansing / Scrub / Detan
  if (
    text.includes("clean") ||
    text.includes("scrub") ||
    text.includes("detan") ||
    text.includes("wash") ||
    text.includes("pore")
  ) {
    return Droplets;
  }

  // 8. Hair Spa / Keratin / Conditioning Treatments
  if (
    text.includes("spa") ||
    text.includes("treatment") ||
    text.includes("keratin") ||
    text.includes("botox") ||
    text.includes("smooth") ||
    text.includes("repair")
  ) {
    return Flower2;
  }

  // 9. Manicure / Pedicure / Nail Art
  if (
    text.includes("nail") ||
    text.includes("manicure") ||
    text.includes("pedicure") ||
    text.includes("polish")
  ) {
    return Hand;
  }

  // 10. Bridal / Groom / Royal packages
  if (
    text.includes("bridal") ||
    text.includes("bride") ||
    text.includes("groom") ||
    text.includes("wedding") ||
    text.includes("royal")
  ) {
    return Crown;
  }

  // 11. Waxing & Threading
  if (text.includes("wax") || text.includes("thread")) {
    return Feather;
  }

  // 12. Blowdry / Hair Dryer / Heat Styling
  if (
    text.includes("blow") ||
    text.includes("dry") ||
    text.includes("iron") ||
    text.includes("curl")
  ) {
    return Wind;
  }

  // Default: Classic Hairdressing Scissors
  return Scissors;
};

/**
 * ServiceIcon component that dynamically renders the appropriate symbol.
 */
export const ServiceIcon = ({
  name = "",
  category = "",
  className = "w-6 h-6",
  ...props
}) => {
  const IconComponent = getServiceIcon(name, category);
  return <IconComponent className={className} {...props} />;
};

export default ServiceIcon;
