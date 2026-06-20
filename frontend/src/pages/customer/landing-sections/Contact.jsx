import React, { useState } from "react";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import api from "../../../services/api";

const Contact = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: ""
  });
  const [status, setStatus] = useState("idle"); // 'idle', 'loading', 'success', 'error'
  const [statusMessage, setStatusMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await api.post("/contact", formData);
      setStatus("success");
      setStatusMessage(res.data.message || "Message sent successfully!");
      setFormData({ firstName: "", lastName: "", email: "", message: "" });
    } catch (error) {
      console.error(error);
      setStatus("error");
      setStatusMessage(error.response?.data?.message || "Failed to send message.");
    }
  };

  return (
    <section id="contact" className="py-24 bg-surface-2 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          
          {/* Contact Info */}
          <div>
            <div className="text-accent font-bold tracking-widest uppercase text-sm mb-3">Get In Touch</div>
            <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-8">
              We'd love to <br /><span className="text-gradient">hear from you.</span>
            </h2>
            <p className="text-white/60 text-lg mb-12">
              Whether you have a question about our services, pricing, or anything else, our team is ready to answer all your questions.
            </p>

            <div className="space-y-8">
              <div className="flex gap-4 items-start">
                <div className="bg-surface p-3 rounded-xl border border-border text-accent">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">Headquarters</h4>
                  <p className="text-white/60">123 Luxury Ave, Downtown District<br/>New York, NY 10001</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="bg-surface p-3 rounded-xl border border-border text-accent">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">Phone</h4>
                  <p className="text-white/60">+1 (555) 123-4567<br/>+1 (555) 987-6543</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="bg-surface p-3 rounded-xl border border-border text-accent">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">Email</h4>
                  <p className="text-white/60">info@salonhub.com<br/>bookings@salonhub.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="glass-card p-8 md:p-10 border-accent/10">
            <h3 className="text-2xl font-bold text-white mb-6">Send us a message</h3>
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
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">First Name</label>
                  <input 
                    type="text" 
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full bg-surface-3 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
                    placeholder="John"
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
                    placeholder="Doe"
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
                  required
                  className="w-full bg-surface-3 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
                  placeholder="john@example.com"
                />
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
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={status === "loading"}
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
