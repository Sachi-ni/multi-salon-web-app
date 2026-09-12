import React, { useState } from "react";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import api from "../../../services/api";
import useFormValidation from "../../../hooks/useFormValidation";
import { validateEmail, validatePhoneGeneric } from "../../../utils/validation";

const Contact = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    subject: "",
    message: ""
  });
  const [status, setStatus] = useState("idle"); // 'idle', 'loading', 'success', 'error'
  const [statusMessage, setStatusMessage] = useState("");
  const { errors, handleBlur, validateAll, isValid, fieldMessages } = useFormValidation(formData, {
    email: validateEmail,
    contactNumber: validatePhoneGeneric,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    setStatus("loading");
    try {
      const res = await api.post("/contact", formData);
      setStatus("success");
      setStatusMessage(res.data.message || "Message sent successfully!");
      setFormData({ firstName: "", lastName: "", email: "", contactNumber: "", subject: "", message: "" });
    } catch (error) {
      console.error(error);
      setStatus("error");
      setStatusMessage(error.response?.data?.message || "Failed to send message.");
    }
  };

  return (
    <section id="contact" className="py-12 md:py-16 bg-[#090909] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-0 lg:px-6">
        <div className="grid lg:grid-cols-[0.72fr_1fr_1.55fr] items-stretch min-h-[690px]">
          <div className="relative min-h-[360px] lg:min-h-0 overflow-hidden hidden lg:block">
            <img src="/salon_interior.png" alt="SalonHub interior" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-[#090909]/80 lg:bg-gradient-to-r lg:from-transparent lg:to-[#090909]" />
          </div>

          <div className="px-6 py-12 lg:px-10 lg:py-10 flex flex-col justify-center">
            <div className="text-accent font-bold tracking-[0.25em] uppercase text-sm mb-4">Contact Us</div>
            <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-[1.08] mb-5">
              Let&apos;s make your <span className="text-gradient">next look</span> happen.
            </h2>
            <p className="text-white/60 leading-relaxed mb-10">
              Premier hair care and beauty services, delivered with expert attention and a personal touch.
            </p>
          
            <div className="text-accent font-bold tracking-[0.25em] uppercase text-sm mb-4">Get In Touch</div>
            <h3 className="text-3xl md:text-4xl font-display font-black text-white mb-5">
              Start your journey to beautiful hair.
            </h3>
            <p className="text-white/60 leading-relaxed mb-10">
              Reach out for expert hair care and personalized services. Our team is ready to help you find the right experience.
            </p>

            <div className="space-y-7">
              <div className="flex gap-4 items-start">
                <div className="bg-surface p-3 rounded-full border border-border text-accent">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Our Location</h4>
                  <p className="text-white/60">Colombo</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="bg-surface p-3 rounded-full border border-border text-accent">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Opening Times</h4>
                  <p className="text-white/60">Monday - Sunday: 9:00 AM - 7:00 PM</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="bg-surface p-3 rounded-full border border-border text-accent">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Our Phone</h4>
                  <a href="tel:011256369" className="text-white/60 hover:text-accent transition-colors">011256369</a>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="bg-surface p-3 rounded-full border border-border text-accent">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Email Us</h4>
                  <div className="flex flex-col gap-1">
                    <a href="mailto:info@salonhub.com" className="text-white/60 hover:text-accent transition-colors">info@salonhub.com</a>
                    <a href="mailto:bookings@salonhub.com" className="text-white/60 hover:text-accent transition-colors">bookings@salonhub.com</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="mx-6 mb-12 lg:mx-0 lg:my-4 glass-card p-6 md:p-8 lg:p-10 border-accent/10 self-stretch">
            <div className="text-accent font-bold tracking-[0.25em] uppercase text-sm mb-3">Send A Message</div>
            <p className="text-white/60 mb-7">Tell us what you have in mind and we&apos;ll get back to you shortly.</p>
            {status === "success" && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500 text-green-400 rounded-xl">
                {statusMessage}
              </div>
            )}
            {status === "error" && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-400 rounded-xl">
                {statusMessage}
              </div>
            )}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">First Name</label>
                  <input 
                    type="text" 
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full bg-surface-3 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
                    placeholder="Your first name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Last Name</label>
                  <input 
                    type="text" 
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full bg-surface-3 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
                    placeholder="Your last name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur("email")}
                  aria-invalid={Boolean(errors.email)}
                  required
                  className="w-full bg-surface-3 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
                  placeholder="Your email"
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                {!errors.email && fieldMessages.email && <p className="text-xs text-muted-2 font-medium">{fieldMessages.email}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    onBlur={() => handleBlur("contactNumber")}
                    aria-invalid={Boolean(errors.contactNumber)}
                    required
                    className="w-full bg-surface-3 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
                    placeholder="Your contact number"
                  />
                  {errors.contactNumber && <p className="text-xs text-red-400">{errors.contactNumber}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full bg-surface-3 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
                    placeholder="How can we help?"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Message</label>
                <textarea 
                  rows="4"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full bg-surface-3 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors resize-none"
                  placeholder="Your message"
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={status === "loading" || !isValid}
                className="w-full py-4 bg-white text-primary rounded-xl font-bold hover:bg-accent transition-colors disabled:opacity-70"
              >
                {status === "loading" ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Contact;
