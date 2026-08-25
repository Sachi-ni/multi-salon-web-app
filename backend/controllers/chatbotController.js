import Salon from "../models/Salon.js";
import Service from "../models/Service.js";

/* ── Intent Detection ── */
const INTENTS = [
  {
    name: "greeting",
    keywords: ["hi", "hello", "hey", "howdy", "good morning", "good afternoon", "good evening", "sup", "yo", "hola"],
  },
  {
    name: "services",
    keywords: ["service", "services", "treatment", "treatments", "what do you offer", "offer", "menu", "what can i get"],
  },
  {
    name: "pricing",
    keywords: ["price", "prices", "pricing", "cost", "how much", "rate", "rates", "charge", "charges", "fee", "fees", "expensive", "cheap", "affordable"],
  },
  {
    name: "booking",
    keywords: ["book", "booking", "appointment", "schedule", "reserve", "reservation", "slot", "available"],
  },
  {
    name: "hours",
    keywords: ["hour", "hours", "open", "close", "closing", "opening", "time", "timing", "when open", "when close", "working hours", "operation"],
  },
  {
    name: "location",
    keywords: ["location", "where", "address", "direction", "directions", "map", "find you", "situated", "place"],
  },
  {
    name: "branches",
    keywords: ["branch", "branches", "salon", "salons", "outlets", "locations", "how many"],
  },
  {
    name: "cancel",
    keywords: ["cancel", "cancellation", "reschedule", "change appointment", "modify booking"],
  },
  {
    name: "contact",
    keywords: ["contact", "phone", "email", "call", "reach", "number", "mail", "talk to someone", "support", "help"],
  },
  {
    name: "thanks",
    keywords: ["thank", "thanks", "thank you", "thx", "appreciate", "great", "awesome", "perfect", "nice"],
  },
];

function detectIntent(message) {
  const lower = message.toLowerCase().trim();

  for (const intent of INTENTS) {
    for (const keyword of intent.keywords) {
      if (lower.includes(keyword)) {
        return intent.name;
      }
    }
  }
  return "fallback";
}

/* ── Intent Handlers ── */
async function handleGreeting() {
  return {
    text: "Hello! 👋 Welcome to **SalonHub**! I'm your virtual assistant. How can I help you today?",
    quickReplies: [
      "Our Services",
      "Pricing",
      "Salon Locations",
      "Book Appointment",
      "Working Hours",
      "Contact Us",
    ],
  };
}

async function handleServices() {
  try {
    const services = await Service.find({}).populate("salon_id", "name").lean();

    if (!services.length) {
      return {
        text: "We're currently updating our service menu. Please check back soon or visit one of our branches for details!",
        quickReplies: ["Salon Locations", "Contact Us"],
      };
    }

    // Group services by salon
    const grouped = {};
    services.forEach((s) => {
      const salonName = s.salon_id?.name || "General";
      if (!grouped[salonName]) grouped[salonName] = [];
      grouped[salonName].push(s);
    });

    let text = "Here are our available services:\n\n";
    for (const [salon, svcs] of Object.entries(grouped)) {
      text += `**📍 ${salon}:**\n`;
      svcs.forEach((s) => {
        text += `  • ${s.service_name} — LKR ${s.base_price.toLocaleString()} (${s.duration} min)\n`;
      });
      text += "\n";
    }
    text += "Would you like to book an appointment?";

    return {
      text,
      quickReplies: ["Book Appointment", "Pricing", "Back to Menu"],
    };
  } catch (err) {
    console.error("Chatbot services error:", err);
    return {
      text: "Sorry, I had trouble loading our services. Please try again in a moment.",
      quickReplies: ["Try Again", "Contact Us"],
    };
  }
}

async function handlePricing() {
  try {
    const services = await Service.find({}).populate("salon_id", "name").lean();

    if (!services.length) {
      return {
        text: "Pricing information is currently being updated. Please contact us for details!",
        quickReplies: ["Contact Us", "Salon Locations"],
      };
    }

    let text = "💰 **Our Pricing:**\n\n";
    const sorted = [...services].sort((a, b) => a.base_price - b.base_price);
    sorted.forEach((s) => {
      const salon = s.salon_id?.name || "";
      text += `• **${s.service_name}** — LKR ${s.base_price.toLocaleString()} _(${s.duration} min)_${salon ? ` — ${salon}` : ""}\n`;
    });
    text += "\nPrices may vary. Book now for the best experience!";

    return {
      text,
      quickReplies: ["Book Appointment", "Our Services", "Back to Menu"],
    };
  } catch (err) {
    console.error("Chatbot pricing error:", err);
    return {
      text: "Sorry, I couldn't load pricing right now. Please try again.",
      quickReplies: ["Try Again", "Contact Us"],
    };
  }
}

async function handleBooking() {
  return {
    text: "Great choice! 🗓️ You can book an appointment through our booking page. Choose your preferred salon, service, staff, date, and time!\n\n👉 **[Click here to book now](/book)**\n\nIf you already have an account, you can also view your appointments in **My Appointments**.",
    quickReplies: ["Our Services", "Salon Locations", "Back to Menu"],
  };
}

async function handleHours() {
  try {
    const salons = await Salon.find({}).lean();

    if (!salons.length) {
      return {
        text: "Operating hours will be available soon. Please contact us directly!",
        quickReplies: ["Contact Us"],
      };
    }

    let text = "🕐 **Our Working Hours:**\n\n";
    salons.forEach((s) => {
      const open = s.open_time || "9:00 AM";
      const close = s.close_time || "6:00 PM";
      text += `📍 **${s.name}**\n   ⏰ ${open} — ${close}\n\n`;
    });
    text += "We look forward to seeing you!";

    return {
      text,
      quickReplies: ["Book Appointment", "Salon Locations", "Back to Menu"],
    };
  } catch (err) {
    console.error("Chatbot hours error:", err);
    return {
      text: "Sorry, I couldn't load hours. Please try again.",
      quickReplies: ["Try Again", "Contact Us"],
    };
  }
}

async function handleLocation() {
  try {
    const salons = await Salon.find({}).lean();

    if (!salons.length) {
      return {
        text: "Location details will be available shortly. Please contact us!",
        quickReplies: ["Contact Us"],
      };
    }

    let text = "📍 **Our Salon Locations:**\n\n";
    salons.forEach((s) => {
      text += `🏪 **${s.name}**\n   📌 ${s.location || "Location to be updated"}\n`;
      if (s.phone) text += `   📞 ${s.phone}\n`;
      text += "\n";
    });

    return {
      text,
      quickReplies: ["Working Hours", "Book Appointment", "Back to Menu"],
    };
  } catch (err) {
    console.error("Chatbot location error:", err);
    return {
      text: "Sorry, I couldn't load locations. Please try again.",
      quickReplies: ["Try Again", "Contact Us"],
    };
  }
}

async function handleBranches() {
  try {
    const salons = await Salon.find({}).lean();

    let text = `We have **${salons.length} salon branch${salons.length !== 1 ? "es" : ""}**:\n\n`;
    salons.forEach((s, i) => {
      text += `${i + 1}. **${s.name}** — ${s.location || "Location TBD"}\n`;
    });
    text += "\nVisit any of our branches for a premium salon experience!";

    return {
      text,
      quickReplies: ["Working Hours", "Our Services", "Book Appointment", "Back to Menu"],
    };
  } catch (err) {
    console.error("Chatbot branches error:", err);
    return {
      text: "Sorry, I couldn't load branch info. Please try again.",
      quickReplies: ["Try Again", "Contact Us"],
    };
  }
}

async function handleCancel() {
  return {
    text: "To cancel or reschedule an appointment:\n\n1. Go to **My Appointments** from the navigation menu\n2. Find the appointment you want to modify\n3. Click the **Cancel** button\n\n👉 **[Go to My Appointments](/my-appointments)**\n\nIf you need further assistance, please contact us directly.",
    quickReplies: ["Contact Us", "Book Appointment", "Back to Menu"],
  };
}

async function handleContact() {
  try {
    const salons = await Salon.find({}).lean();

    let text = "📞 **Contact Us:**\n\n";
    if (salons.length > 0) {
      salons.forEach((s) => {
        text += `🏪 **${s.name}**\n`;
        if (s.phone) text += `   📱 ${s.phone}\n`;
        if (s.email) text += `   📧 ${s.email}\n`;
        if (s.contact_info) text += `   ℹ️ ${s.contact_info}\n`;
        text += "\n";
      });
    }
    text += "You can also reach us through the **Contact** section on our website. We're happy to help! 😊";

    return {
      text,
      quickReplies: ["Salon Locations", "Working Hours", "Back to Menu"],
    };
  } catch (err) {
    console.error("Chatbot contact error:", err);
    return {
      text: "Sorry, I couldn't load contact info. Please try again.",
      quickReplies: ["Try Again"],
    };
  }
}

function handleThanks() {
  return {
    text: "You're welcome! 😊 Is there anything else I can help you with?",
    quickReplies: ["Our Services", "Book Appointment", "Salon Locations", "No, thanks!"],
  };
}

function handleFallback() {
  return {
    text: "I'm sorry, I didn't quite understand that. 🤔 Here are some things I can help you with:",
    quickReplies: [
      "Our Services",
      "Pricing",
      "Book Appointment",
      "Salon Locations",
      "Working Hours",
      "Contact Us",
    ],
  };
}

/* ── Main Controller ── */
export const handleChatMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const intent = detectIntent(message);

    let response;
    switch (intent) {
      case "greeting":
        response = await handleGreeting();
        break;
      case "services":
        response = await handleServices();
        break;
      case "pricing":
        response = await handlePricing();
        break;
      case "booking":
        response = await handleBooking();
        break;
      case "hours":
        response = await handleHours();
        break;
      case "location":
        response = await handleLocation();
        break;
      case "branches":
        response = await handleBranches();
        break;
      case "cancel":
        response = await handleCancel();
        break;
      case "contact":
        response = await handleContact();
        break;
      case "thanks":
        response = handleThanks();
        break;
      default:
        response = handleFallback();
    }

    // Handle "Back to Menu" / "No, thanks!" quick replies
    if (message.toLowerCase().includes("back to menu") || message.toLowerCase().includes("try again")) {
      response = await handleGreeting();
    }
    if (message.toLowerCase().includes("no, thanks")) {
      response = {
        text: "Alright! Have a wonderful day! ✨ Feel free to chat anytime you need help.",
        quickReplies: ["Back to Menu"],
      };
    }

    return res.json({
      reply: response.text,
      quickReplies: response.quickReplies || [],
      intent,
    });
  } catch (err) {
    console.error("Chatbot error:", err);
    return res.status(500).json({
      reply: "Oops! Something went wrong on our end. Please try again in a moment.",
      quickReplies: ["Try Again"],
      intent: "error",
    });
  }
};
