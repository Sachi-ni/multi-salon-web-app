import Salon from "../models/Salon.js";
import Service from "../models/Service.js";
import mongoose from "mongoose";

/* ── Intent Detection ── */
// Specific domain intents are placed first so inquiries like "Hi, what are your prices?"
// are correctly routed to pricing rather than being hijacked by generic greetings.
const INTENTS = [
  {
    name: "pricing",
    keywords: ["price", "prices", "pricing", "cost", "how much", "rate", "rates", "charge", "charges", "fee", "fees", "expensive", "cheap", "affordable"],
  },
  {
    name: "booking",
    keywords: ["book", "booking", "appointment", "schedule", "reserve", "reservation", "slot", "available", "make an appointment"],
  },
  {
    name: "hours",
    keywords: ["hour", "hours", "open", "close", "closing", "opening", "time", "timing", "when open", "when close", "working hours", "operation", "operating hours"],
  },
  {
    name: "location",
    keywords: ["location", "where", "address", "direction", "directions", "map", "find you", "situated", "place"],
  },
  {
    name: "branches",
    keywords: ["branch", "branches", "salon", "salons", "outlets", "locations", "how many branches"],
  },
  {
    name: "consultant",
    keywords: [
      "style consultant", "consultant", "hairstyle", "hair style", "haircut", "hair cut",
      "hair care", "haircare", "routine", "shampoo", "conditioner", "curly", "coily", "straight",
      "wavy", "frizzy", "thin hair", "thick hair", "scalp", "dandruff", "split ends",
      "wedding hair", "keratin", "recommend a style", "what style", "which haircut",
      "face shape", "hair advice", "style advice", "treatment recommendation", "recommend",
      "hair loss", "hair fall", "damaged hair", "dry hair", "oily scalp", "balayage", "blowout"
    ],
  },
  {
    name: "services",
    keywords: ["service", "services", "treatment", "treatments", "what do you offer", "offer", "menu", "what can i get", "catalog"],
  },
  {
    name: "cancel",
    keywords: ["cancel", "cancellation", "reschedule", "change appointment", "modify booking"],
  },
  {
    name: "contact",
    keywords: ["contact", "phone", "email", "call", "reach", "number", "mail", "talk to someone", "support", "help", "customer service"],
  },
  {
    name: "thanks",
    keywords: ["thank", "thanks", "thank you", "thx", "appreciate", "great", "awesome", "perfect", "nice"],
  },
  {
    name: "greeting",
    keywords: ["hi", "hello", "hey", "howdy", "good morning", "good afternoon", "good evening", "sup", "yo", "hola"],
  },
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function detectIntent(message) {
  const lower = message.toLowerCase().trim();

  // Fast-track exact quick reply matches
  if (lower.includes("style consultant") || lower === "✨ style consultant") return "consultant";
  if (lower === "our services" || lower === "services") return "services";
  if (lower === "pricing" || lower === "prices") return "pricing";
  if (lower === "salon locations" || lower === "locations") return "location";
  if (lower === "book appointment" || lower === "book now") return "booking";
  if (lower === "working hours" || lower === "hours") return "hours";
  if (lower === "contact us" || lower === "contact") return "contact";

  for (const intent of INTENTS) {
    for (const keyword of intent.keywords) {
      const escaped = escapeRegex(keyword);
      // Word boundaries ensure short keywords like "hi" don't falsely match inside words like "chic" or "which"
      const regex = new RegExp(`(^|\\b)${escaped}(\\b|$)`, "i");
      if (regex.test(lower)) {
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
    const services = await Service.find({ status: "Active" }).populate("salon_id", "name").lean().maxTimeMS(3000);

    if (!services.length) {
      return {
        text: "We're currently updating our service menu. Please check back soon or visit one of our branches for details!",
        quickReplies: ["Salon Locations", "Contact Us", "Back to Menu"],
      };
    }

    // Group services by salon
    const grouped = {};
    services.forEach((s) => {
      const salonName = s.salon_id?.name || "All Branches";
      if (!grouped[salonName]) grouped[salonName] = [];
      grouped[salonName].push(s);
    });

    let text = "✨ **Our Available Salon Services:**\n\n";
    for (const [salon, svcs] of Object.entries(grouped)) {
      text += `📍 **${salon}:**\n`;
      svcs.forEach((s) => {
        text += `  • **${s.service_name}** — LKR ${Number(s.base_price || 0).toLocaleString()} (${s.duration || 30} min)\n`;
      });
      text += "\n";
    }
    text += "Ready to book your transformation?\n👉 [Click here to Book an Appointment](/book)";

    return {
      text,
      quickReplies: ["Book Appointment", "Pricing", "✨ Style Consultant", "Back to Menu"],
    };
  } catch (err) {
    console.error("Chatbot services error:", err);
    return {
      text: "Sorry, I had trouble loading our services. Please try again in a moment.",
      quickReplies: ["Try Again", "Contact Us", "Back to Menu"],
    };
  }
}

async function handlePricing() {
  try {
    const services = await Service.find({ status: "Active" }).populate("salon_id", "name").lean().maxTimeMS(3000);

    if (!services.length) {
      return {
        text: "Pricing information is currently being updated. Please contact us for details!",
        quickReplies: ["Contact Us", "Salon Locations", "Back to Menu"],
      };
    }

    let text = "💰 **SalonHub Service Pricing:**\n\n";
    const sorted = [...services].sort((a, b) => (a.base_price || 0) - (b.base_price || 0));
    sorted.forEach((s) => {
      const salon = s.salon_id?.name || "";
      text += `• **${s.service_name}** — LKR ${Number(s.base_price || 0).toLocaleString()} _(${s.duration || 30} min)_${salon ? ` — *${salon}*` : ""}\n`;
    });
    text += "\n*Prices are all-inclusive. Book now to reserve your spot!*\n👉 [Click here to Book an Appointment](/book)";

    return {
      text,
      quickReplies: ["Book Appointment", "Our Services", "✨ Style Consultant", "Back to Menu"],
    };
  } catch (err) {
    console.error("Chatbot pricing error:", err);
    return {
      text: "Sorry, I couldn't load pricing right now. Please try again.",
      quickReplies: ["Try Again", "Contact Us", "Back to Menu"],
    };
  }
}

async function handleBooking() {
  return {
    text: "Great choice! 🗓️ You can book an appointment through our online booking portal in seconds:\n\n1. Select your preferred Salon branch\n2. Pick your desired service & stylist\n3. Choose your date & convenient time slot\n\n👉 [Click here to Book an Appointment](/book)\n\nIf you already booked, check **My Appointments** to view or manage your schedule.",
    quickReplies: ["Our Services", "Salon Locations", "✨ Style Consultant", "Back to Menu"],
  };
}

async function handleHours() {
  try {
    const salons = await Salon.find({ status: { $ne: "deactivated" } }).lean().maxTimeMS(3000);

    if (!salons.length) {
      return {
        text: "Operating hours will be available soon. Please contact us directly!",
        quickReplies: ["Contact Us", "Back to Menu"],
      };
    }

    let text = "🕐 **Our Salon Working Hours:**\n\n";
    salons.forEach((s) => {
      const open = s.open_time || "08:30";
      const close = s.close_time || "20:00";
      text += `📍 **${s.name}**\n   ⏰ Open: ${open} — Close: ${close}\n\n`;
    });
    text += "Walk-ins and advance bookings are warmly welcome!";

    return {
      text,
      quickReplies: ["Book Appointment", "Salon Locations", "Back to Menu"],
    };
  } catch (err) {
    console.error("Chatbot hours error:", err);
    return {
      text: "Sorry, I couldn't load hours. Please try again.",
      quickReplies: ["Try Again", "Contact Us", "Back to Menu"],
    };
  }
}

async function handleLocation() {
  try {
    const salons = await Salon.find({ status: { $ne: "deactivated" } }).lean().maxTimeMS(3000);

    if (!salons.length) {
      return {
        text: "Location details will be available shortly. Please contact us!",
        quickReplies: ["Contact Us", "Back to Menu"],
      };
    }

    let text = "📍 **Our Salon Locations:**\n\n";
    salons.forEach((s) => {
      text += `🏪 **${s.name}**\n   📌 ${s.location || "Location to be updated"}\n`;
      if (s.phone) text += `   📞 Phone: ${s.phone}\n`;
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
      quickReplies: ["Try Again", "Contact Us", "Back to Menu"],
    };
  }
}

async function handleBranches() {
  try {
    const salons = await Salon.find({ status: { $ne: "deactivated" } }).lean().maxTimeMS(3000);

    let text = `We have **${salons.length} salon branch${salons.length !== 1 ? "es" : ""}** available:\n\n`;
    salons.forEach((s, i) => {
      text += `${i + 1}. **${s.name}** — ${s.location || "Location TBD"}\n`;
    });
    text += "\nVisit any of our branches for a luxurious salon experience!";

    return {
      text,
      quickReplies: ["Working Hours", "Our Services", "Book Appointment", "Back to Menu"],
    };
  } catch (err) {
    console.error("Chatbot branches error:", err);
    return {
      text: "Sorry, I couldn't load branch info. Please try again.",
      quickReplies: ["Try Again", "Contact Us", "Back to Menu"],
    };
  }
}

async function handleCancel() {
  return {
    text: "To cancel or reschedule an existing appointment:\n\n1. Go to **My Appointments** from the customer portal\n2. Locate your scheduled booking\n3. Click the **Cancel** button\n\n👉 [Go to My Appointments](/my-appointments)\n\nNeed immediate help? Reach out to our front desk directly.",
    quickReplies: ["Contact Us", "Book Appointment", "Back to Menu"],
  };
}

async function handleContact() {
  try {
    const salons = await Salon.find({ status: { $ne: "deactivated" } }).lean().maxTimeMS(3000);

    let text = "📞 **Contact SalonHub:**\n\n";
    if (salons.length > 0) {
      salons.forEach((s) => {
        text += `🏪 **${s.name}**\n`;
        if (s.phone) text += `   📱 ${s.phone}\n`;
        if (s.email) text += `   📧 ${s.email}\n`;
        if (s.location) text += `   📍 ${s.location}\n`;
        text += "\n";
      });
    }
    text += "You can also message us through the website or visit our reception desk during operating hours!";

    return {
      text,
      quickReplies: ["Salon Locations", "Working Hours", "Back to Menu"],
    };
  } catch (err) {
    console.error("Chatbot contact error:", err);
    return {
      text: "Sorry, I couldn't load contact info. Please try again.",
      quickReplies: ["Try Again", "Back to Menu"],
    };
  }
}

function handleThanks() {
  return {
    text: "You're very welcome! 😊 It's my pleasure to help. Is there anything else you'd like to explore?",
    quickReplies: ["✨ Style Consultant", "Our Services", "Book Appointment", "Salon Locations", "No, thanks!"],
  };
}

function handleFallback() {
  return {
    text: "I'm sorry, I didn't quite catch that. 🤔 Here are some quick topics I can help you with:",
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
      "✂️ **Sleek French Bob**: Sharp jaw-length cut that gives straight strands instant thickness and modern chic.",
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
    keywords: ["wedding", "bride", "bridal", "groom", "party", "event", "ceremony", "formal", "prom", "ball", "function", "special event"],
    tip: "Focus on all-day long-lasting hold, romantic tendrils, and radiant mirror-like shine."
  },
  everyday: {
    name: "Everyday Chic",
    keywords: ["everyday", "daily", "casual", "low maintenance", "simple", "quick", "easy", "effortless", "chic"],
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
3. 🌟 **SalonHub Service Match**: Pick 1-2 matching services from our actual database above with prices in LKR.
4. Keep the tone warm, welcoming, and high-end with markdown headings and emojis. Keep length concise (around 150-250 words).
5. Conclude with: "👉 [Book This Service Now](/book)"`;

  const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-3.5-flash"];
  for (const model of modelsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1500,
            },
          }),
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
      }
    } catch (err) {
      // Try next model
    }
  }
  return null;
}

/* ── General Freeform Assistant using Gemini AI ── */
async function callGeminiGeneral(userMessage, servicesContext, salonsContext) {
  if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_API_KEY.trim()) {
    return null;
  }

  const apiKey = process.env.GEMINI_API_KEY.trim();
  const systemPrompt = `You are the friendly, professional virtual assistant for SalonHub, a premium multi-salon management web platform.
A client asks: "${userMessage}".

SalonHub Context:
- Salons: ${salonsContext || "AURA (Gampaha), Salon 89"}
- Popular Services: ${servicesContext || "Hair Cutting, Keratin Smoothing Treatment, Deep Conditioning Hair Spa, Facials, Makeup"}
- Online Booking: Clients can select branch, service, stylist, date & time slot at /book.
- Payments: Cash, Card, and Online transfers accepted at salons.

Instructions:
1. Provide a direct, polite, helpful answer in 2-4 sentences.
2. If relevant, mention matching services with prices in LKR.
3. Keep the tone warm, welcoming, and professional with friendly emojis.
4. Conclude with: "👉 [Click here to Book an Appointment](/book)"
5. Output ONLY your direct conversational message to the client. Do NOT output any analysis, reasoning steps, or preamble.`;

  const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-3.5-flash"];
  for (const model of modelsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 1000,
            },
          }),
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
      }
    } catch (_) {}
  }
  return null;
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
      const services = await Service.find({ status: "Active" }).populate("salon_id", "name").lean().maxTimeMS(2500);
      if (services && services.length > 0) {
        // Find services matching category keywords
        const matchedSvcs = services.filter((s) => {
          const name = (s.service_name || "").toLowerCase();
          return profile.recommendedCategory.some((cat) => name.includes(cat));
        }).slice(0, 3);

        const targetList = matchedSvcs.length > 0 ? matchedSvcs : services.slice(0, 3);
        matchingServicesText = targetList
          .map((s) => `• **${s.service_name}** — LKR ${Number(s.base_price || 0).toLocaleString()} (${s.duration || 30} min)${s.salon_id?.name ? ` at _${s.salon_id.name}_` : ""}`)
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

/* ── Fallback Handler with Smart AI Support ── */
async function handleSmartFallback(message) {
  let servicesContext = "";
  let salonsContext = "";
  try {
    if (mongoose.connection.readyState === 1) {
      const [services, salons] = await Promise.all([
        Service.find({ status: "Active" }).select("service_name base_price duration").lean().limit(8).maxTimeMS(2500),
        Salon.find({ status: { $ne: "deactivated" } }).select("name location phone").lean().limit(5).maxTimeMS(2500)
      ]);
      if (services?.length) {
        servicesContext = services.map(s => `${s.service_name}: LKR ${s.base_price}`).join(", ");
      }
      if (salons?.length) {
        salonsContext = salons.map(s => `${s.name} (${s.location})`).join(", ");
      }
    }
  } catch (_) {}

  const aiReply = await callGeminiGeneral(message, servicesContext, salonsContext);
  if (aiReply) {
    return {
      text: aiReply,
      quickReplies: ["Book Appointment", "✨ Style Consultant", "Our Services", "Back to Menu"],
    };
  }

  return handleFallback();
}

/* ── Main Controller ── */
export const handleChatMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const lower = message.toLowerCase().trim();

    // Direct navigation triggers
    if (lower === "back to menu" || lower === "menu" || lower === "start over" || lower === "try again" || lower === "reset") {
      const response = await handleGreeting();
      return res.json({
        reply: response.text,
        quickReplies: response.quickReplies || [],
        intent: "greeting",
      });
    }

    if (lower === "no, thanks!" || lower === "no, thanks" || lower === "no thanks") {
      return res.json({
        reply: "Alright! Have a wonderful day! ✨ Feel free to chat anytime you need salon assistance or styling advice.",
        quickReplies: ["✨ Style Consultant", "Back to Menu"],
        intent: "thanks",
      });
    }

    const intent = detectIntent(message);

    let response;
    switch (intent) {
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
      case "greeting":
        response = await handleGreeting();
        break;
      default:
        response = await handleSmartFallback(message);
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
