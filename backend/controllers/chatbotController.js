import Salon from "../models/Salon.js";
import Service from "../models/Service.js";
import mongoose from "mongoose";

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
    name: "consultant",
    keywords: [
      "style consultant", "consultant", "hairstyle", "hair style", "haircut", "hair cut",
      "hair care", "haircare", "routine", "shampoo", "conditioner", "curly", "straight",
      "wavy", "frizzy", "thin hair", "thick hair", "scalp", "dandruff", "split ends",
      "wedding hair", "keratin", "recommend a style", "what style", "which haircut",
      "face shape", "hair advice", "style advice", "treatment recommendation", "recommend"
    ],
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
    text: "Hello! 👋 Welcome to **SalonHub**! I'm your virtual assistant & AI style consultant. How can I help you today?",
    quickReplies: [
      "✨ Style Consultant",
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
    text: "Great choice! 🗓️ You can book an appointment through our booking page. Choose your preferred salon, service, staff, date, and time!\n\n👉 [Click here to book now](/book)\n\nIf you already have an account, you can also view your appointments in **My Appointments**.",
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
    text: "To cancel or reschedule an appointment:\n\n1. Go to **My Appointments** from the navigation menu\n2. Find the appointment you want to modify\n3. Click the **Cancel** button\n\n👉 [Go to My Appointments](/my-appointments)\n\nIf you need further assistance, please contact us directly.",
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
    quickReplies: ["✨ Style Consultant", "Our Services", "Book Appointment", "Salon Locations", "No, thanks!"],
  };
}

function handleFallback() {
  return {
    text: "I'm sorry, I didn't quite understand that. 🤔 Here are some things I can help you with:",
    quickReplies: [
      "✨ Style Consultant",
      "Our Services",
      "Pricing",
      "Book Appointment",
      "Salon Locations",
      "Working Hours",
      "Contact Us",
    ],
  };
}

/* ── AI Style Consultant Data & Handler ── */
const HAIR_PROFILES = {
  straight: {
    name: "Straight Hair",
    keywords: ["straight"],
    hairstyles: [
      "✂️ **Sleek French Bob**: Sharp jaw-length cut that gives fine or straight strands instant thickness and modern chic.",
      "✂️ **Long Fluid Layers with Curtain Bangs**: Adds dynamic movement and body without sacrificing length.",
      "✂️ **Glass Hair Blunt Cut**: Sleek, mirror-shine cut designed to turn heads at any event."
    ],
    routine: [
      "🧴 **Wash**: Use a lightweight volumizing shampoo 2-3 times per week.",
      "🧴 **Hydrate**: Apply weightless conditioner strictly from mid-lengths to ends to keep roots fresh and buoyant.",
      "🧴 **Styling**: Blow dry upside down with a round ceramic brush for all-day natural volume."
    ],
    recommendedCategory: ["haircut", "blowdry", "cut", "styling"]
  },
  wavy: {
    name: "Wavy Hair",
    keywords: ["wavy", "wave", "waves"],
    hairstyles: [
      "✂️ **Cascading Butterfly Layers**: Gorgeous, flowing layers that effortlessly enhance natural wave texture and bounce.",
      "✂️ **Textured Collarbone Lob**: A versatile length framing the collarbone, ideal for effortless beach waves.",
      "✂️ **Soft Shag with Wispy Fringe**: Rock-and-roll chic with light crown layering."
    ],
    routine: [
      "🧴 **Wash**: Sulfate-free moisture shampoo to prevent dryness and preserve natural wave curls.",
      "🧴 **Hydrate**: Scrunch in leave-in curl enhancer or mousse while hair is towel-damp.",
      "🧴 **Styling**: Air-dry or diffuse on medium heat; seal ends with lightweight argan oil."
    ],
    recommendedCategory: ["layer", "cut", "haircut", "styling", "spa"]
  },
  curly: {
    name: "Curly / Coily Hair",
    keywords: ["curly", "curl", "curls", "coily", "coil", "coils", "afro"],
    hairstyles: [
      "✂️ **Round Layered Cut with Curly Bangs**: Balances weight, avoids triangle shape, and lets ringlets frame the face beautifully.",
      "✂️ **Defined Bouncy Curly Bob**: Statement jaw-to-shoulder cut celebrating vibrant natural volume.",
      "✂️ **Half-Up Goddess Crown**: Romantic pinning on top with defined cascading ringlets."
    ],
    routine: [
      "🧴 **Wash**: Gentle sulfate-free co-wash or moisturizing shampoo once or twice a week.",
      "🧴 **Hydrate**: Apply rich leave-in conditioner using 'praying hands' method onto soaking wet hair.",
      "🧴 **Styling**: Apply curl-defining gel and gently plop with a microfiber towel; never brush dry curls."
    ],
    recommendedCategory: ["keratin", "conditioning", "spa", "treatment", "curl"]
  },
  thin: {
    name: "Thin / Fine Hair",
    keywords: ["thin", "fine", "flat", "volume", "limp", "loss", "scanty"],
    hairstyles: [
      "✂️ **Blunt Parisian Cut**: Clean blunt ends instantly create the optical illusion of double the hair density.",
      "✂️ **Feathered Textured Pixie**: Lightweight crown layers provide permanent lift without needing tons of product.",
      "✂️ **Internal Invisible Layers**: Adds air and separation inside the hair without thinning the perimeter."
    ],
    routine: [
      "🧴 **Wash**: Clarifying & volumizing caffeine/biotin shampoo to keep roots grease-free and energized.",
      "🧴 **Hydrate**: Ultra-lightweight rinse-out conditioner; avoid heavy oils on the scalp.",
      "🧴 **Styling**: Dry texturizing spray at the roots for instant non-sticky grit and hold."
    ],
    recommendedCategory: ["scalp", "cut", "blowdry", "treatment"]
  },
  frizzy: {
    name: "Frizzy / Dry / Damaged Hair",
    keywords: ["frizzy", "frizz", "dry", "rough", "coarse", "damaged", "bleached", "color", "split"],
    hairstyles: [
      "✂️ **Face-Framing Smooth Layers**: Softly blended layers that remove damaged split weight and promote smooth styling.",
      "✂️ **Silky Shoulder-Length Cut with Beveled Ends**: Polished silhouette that minimizes flyaways.",
      "✂️ **Protective Braided Updo / Chignon**: Elegant styling that keeps fragile ends tucked and protected."
    ],
    routine: [
      "🧴 **Wash**: Deep moisture repair shampoo rich in keratin, argan, or shea butter.",
      "🧴 **Hydrate**: Weekly restorative protein hair mask with a warm towel wrap.",
      "🧴 **Protection**: Always spray thermal heat protectant before heat styling; sleep on a satin or silk pillowcase."
    ],
    recommendedCategory: ["keratin", "spa", "conditioning", "treatment", "therapy"]
  }
};

const OCCASIONS = {
  wedding: {
    name: "Wedding / Special Event",
    keywords: ["wedding", "bride", "bridal", "groom", "party", "event", "ceremony", "formal", "prom", "ball", "function"],
    tip: "Focus on all-day long-lasting hold, romantic tendrils, and radiant mirror-like shine."
  },
  everyday: {
    name: "Everyday Chic",
    keywords: ["everyday", "daily", "casual", "low maintenance", "simple", "quick", "easy", "effortless"],
    tip: "Focus on wash-and-go simplicity that looks effortlessly polished in under 5 minutes."
  },
  work: {
    name: "Professional / Office",
    keywords: ["work", "office", "professional", "meeting", "interview", "corporate", "formal"],
    tip: "Focus on clean symmetry, sleek low buns, or sophisticated blowouts that convey poise and elegance."
  },
  repair: {
    name: "Intense Repair & Care",
    keywords: ["repair", "grow", "growth", "health", "hydrate", "moisture", "dandruff", "fall", "care"],
    tip: "Focus on restorative scalp therapy, salon bond-repair treatments, and sealing damaged cuticles."
  }
};

async function callGeminiAI(userMessage, servicesContext) {
  if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_API_KEY.trim()) {
    return null;
  }

  const apiKey = process.env.GEMINI_API_KEY.trim();
  const systemPrompt = `You are the expert Senior AI Stylist & Hair Care Consultant at SalonHub (a premium multi-salon management platform).
A client is asking: "${userMessage}".

Available SalonHub Services in our Database:
${servicesContext || "Haircuts, Keratin Smoothing Treatment, Deep Conditioning Hair Spa, Scalp Revitalizer, Hair Coloring"}

Please provide a personalized, chic, and practical response:
1. ✂️ **Recommended Hairstyles**: Suggest 1-2 cuts/styles that will flatter their hair profile or occasion, explaining why.
2. 🧴 **Custom Hair Care Routine**: Give 2-3 specific morning/evening/wash steps.
3. 🌟 **SalonHub Service Match**: Pick 1-2 matching services from our actual database above with prices.
4. Keep the tone warm, welcoming, and high-end with markdown headings and emojis. Keep length concise (around 150-250 words).
5. Conclude with: "👉 [Book This Service Now](/book)"`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 550,
          },
        }),
      }
    );

    const data = await res.json();
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    return null;
  } catch (err) {
    console.warn("Gemini API call skipped, falling back to smart rules:", err.message);
    return null;
  }
}

async function handleConsultant(message) {
  const lower = message.toLowerCase();

  // If user just initiated the consultant flow
  if (
    lower.includes("style consultant") ||
    lower.includes("consultant") ||
    lower === "✨ style consultant" ||
    lower === "hair advice"
  ) {
    return {
      text: "✨ **Welcome to the SalonHub AI Style & Hair Care Consultant!** 💇‍♀️💇‍♂️\n\nI can help you find your most flattering hairstyle, treatments, and a custom daily hair care routine.\n\n**Step 1 of 2: What is your hair type or primary concern?**",
      quickReplies: [
        "Straight Hair",
        "Wavy Hair",
        "Curly / Coily",
        "Thin / Fine Hair",
        "Frizzy / Dry Hair",
        "Back to Menu",
      ],
    };
  }

  // Detect hair type
  let detectedType = null;
  for (const profile of Object.values(HAIR_PROFILES)) {
    if (profile.keywords.some((k) => lower.includes(k))) {
      detectedType = profile;
      break;
    }
  }

  // Detect occasion
  let detectedOccasion = null;
  for (const occ of Object.values(OCCASIONS)) {
    if (occ.keywords.some((k) => lower.includes(k))) {
      detectedOccasion = occ;
      break;
    }
  }

  // If only hair type was chosen and no occasion yet, ask Step 2
  if (detectedType && !detectedOccasion) {
    return {
      text: `Got it! **${detectedType.name}** ✨\n\n**Step 2 of 2: What is your primary occasion or styling goal?**`,
      quickReplies: [
        `${detectedType.name} for Wedding / Special Event`,
        `${detectedType.name} for Everyday Chic`,
        `${detectedType.name} for Professional / Work`,
        `${detectedType.name} for Intense Repair & Care`,
        "Back to Menu",
      ],
    };
  }

  // Fallback to Wavy / Everyday if neither detected
  const profile = detectedType || HAIR_PROFILES.wavy;
  const occasion = detectedOccasion || OCCASIONS.everyday;

  // Retrieve salon services from database for context matching (with connection check & timeout)
  let matchingServicesText = "";
  try {
    if (mongoose.connection.readyState === 1) {
      const services = await Service.find({}).populate("salon_id", "name").lean().maxTimeMS(2500);
      if (services && services.length > 0) {
        // Find services matching category keywords
        const matchedSvcs = services.filter((s) => {
          const name = (s.service_name || "").toLowerCase();
          return profile.recommendedCategory.some((cat) => name.includes(cat));
        }).slice(0, 3);

        const targetList = matchedSvcs.length > 0 ? matchedSvcs : services.slice(0, 3);
        matchingServicesText = targetList
          .map((s) => `• **${s.service_name}** — LKR ${s.base_price.toLocaleString()} (${s.duration} min)${s.salon_id?.name ? ` at _${s.salon_id.name}_` : ""}`)
          .join("\n");
      }
    }
  } catch (err) {
    console.warn("Consultant service query skipped:", err.message);
  }

  // Try Gemini AI first
  const geminiReply = await callGeminiAI(message, matchingServicesText);
  if (geminiReply) {
    return {
      text: geminiReply,
      quickReplies: [
        "Book Appointment",
        "✨ Style Consultant",
        "Our Services",
        "Back to Menu",
      ],
    };
  }

  // Smart Rule-Based Engine (100% offline & free)
  let reply = `✨ **Your Personalized SalonHub Style Profile** ✨\n\n`;
  reply += `👤 **Hair Profile:** ${profile.name}\n`;
  reply += `🎯 **Focus:** ${occasion.name} — _${occasion.tip}_\n\n`;

  reply += `### ✂️ Flattering Hairstyles for You:\n`;
  profile.hairstyles.forEach((style) => {
    reply += `${style}\n`;
  });

  reply += `\n### 🧴 Recommended Hair Care Routine:\n`;
  profile.routine.forEach((step) => {
    reply += `${step}\n`;
  });

  if (matchingServicesText) {
    reply += `\n### 🌟 Recommended SalonHub Treatments:\n${matchingServicesText}\n`;
  }

  reply += `\nReady for your salon transformation?\n👉 [Click here to Book an Appointment](/book)`;

  return {
    text: reply,
    quickReplies: [
      "Book Appointment",
      "✨ Style Consultant",
      "Our Services",
      "Pricing",
      "Back to Menu",
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
      case "consultant":
        response = await handleConsultant(message);
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
        quickReplies: ["✨ Style Consultant", "Back to Menu"],
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
      quickReplies: ["✨ Style Consultant", "Try Again"],
      intent: "error",
    });
  }
};
