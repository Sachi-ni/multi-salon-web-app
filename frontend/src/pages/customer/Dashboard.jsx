import React from "react";
import CustomerHeader from "../../components/layout/CustomerHeader";
import CustomerFooter from "../../components/layout/CustomerFooter";

const CustomerHome = () => {
  return (
    <div className="salon-app-bg min-h-screen">
      <CustomerHeader />

      <main className="salon-main-container">
        
        {/* 1. HERO IMAGE SECTION */}
        <section className="hero-frame">
          <img 
            src="https://images.pexels.com/photos/3993444/pexels-photo-3993444.jpeg?auto=compress&cs=tinysrgb&w=1260" 
            className="w-full h-full object-cover" 
            alt="Salon Interior"
          />
        </section>

        {/* 2. HAIRCUTS & STYLING SECTION */}
        <section className="salon-layout-row">
          <div className="media-side">
            <div className="w-full h-[500px] overflow-hidden rounded-2xl">
              <img 
                src="https://images.pexels.com/photos/3992874/pexels-photo-3992874.jpeg?auto=compress&cs=tinysrgb&w=800" 
                className="w-full h-full object-cover" 
                alt="Haircutting"
              />
            </div>
          </div>
          <div className="text-side">
            <div className="accent-star">✱</div>
            <h2 className="heavy-gold-title">HAIRCUTS AND <br/> STYLING</h2>
            <p className="clean-description">
              Experience top-notch haircuts and styling tailored to your unique needs. 
              Our expert stylists are dedicated to transforming your look and ensuring 
              you leave feeling confident and refreshed. Book your appointment today!
            </p>
          </div>
        </section>

        {/* 3. TRANSFORMATIONS SECTION */}
        <section className="salon-layout-row">
          <div className="media-side">
            <div className="ba-flex-grid">
              <div className="ba-photo-card">
                <img src="https://images.pexels.com/photos/3356170/pexels-photo-3356170.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Before" />
                <div className="ba-label">Before</div>
              </div>
              <div className="ba-photo-card">
                <img src="https://images.pexels.com/photos/374044/pexels-photo-374044.jpeg?auto=compress&cs=tinysrgb&w=600" alt="After" />
                <div className="ba-label">After</div>
              </div>
            </div>
          </div>
          <div className="text-side">
            <h2 className="heavy-gold-title">TRANSFORMATIONS <br/> & STYLES</h2>
            <p className="clean-description">
              Discover our stunning transformations that showcase the artistry of our 
              skilled stylists. From bold cuts to elegant styles, our gallery illustrates 
              the incredible changes our clients experience.
            </p>
          </div>
        </section>

      </main>

      <CustomerFooter />
    </div>
  );
};

export default CustomerHome;