import React from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";
import { useAuth } from "../../context/AuthContext";

const Profile = () => {
    const { user } = useAuth();
    console.log("User in Profile:", user);
    const navigate = useNavigate();

    return (
        <>
        <div className="sphdr">
            <h2>👤 Admin Profile</h2>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'14px',padding:'16px',background:'var(--s2)',borderRadius:'12px',marginBottom:'20px',border:'1px solid var(--border)'}}>
            <div style={{width:'52px',height:'52px',borderRadius:'12px',background:'var(--yellow)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',fontWeight:'900',color:'var(--bg)',flexShrink:'0'}}>SA</div>
            <div>
            <div style={{fontWeight:'800',fontSize:'.95rem',color:'var(--text)'}}>{user?.name || 'Super Admin'}</div>
            <div style={{fontSize:'.75rem',color:'var(--muted2)'}}>{user?.email || 'admin@salonhub.com'}</div>
            <div style={{fontSize:'.65rem',color:'var(--yellow)',marginTop:'3px',fontWeight:'700'}}>● Online</div>
            </div>
        </div>
        <div style={{marginBottom:'20px'}}>
            <div className="pf-field"><label>Name</label><input className="pf-inp" id="pf-name" defaultValue={user?.name || 'Super Admin'}/></div>
            <div className="pf-field"><label>Email</label><input className="pf-inp" type="email" id="pf-email" defaultValue={user?.email || 'admin@salonhub.com'}/></div>
            <div className="pf-field"><label>Phone</label><input className="pf-inp" type="tel" id="pf-phone" defaultValue={user?.phone || '+1234567890'}/></div>
            <div className="pf-field"><label>Timezone</label><select className="pf-inp" id="pf-tz"><option>UTC</option><option>EST</option><option>PST</option><option>IST</option></select></div>
            <button 
            className="btn btn-p sm" 
            onClick={() => navigate("/editProfile")} 
            style={{marginTop:'4px'}}
            >
            ✏️ Edit Profile
            </button>
        </div>
        
        <button className="btn btn-d" style={{width:'100%',justifyContent:'center',marginTop:'4px'}} onClick={() => navigate('/')}>🚪 Sign Out</button>
        </>
    );
}

export default Profile;