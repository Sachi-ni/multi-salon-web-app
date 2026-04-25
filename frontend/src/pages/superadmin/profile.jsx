import React from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";

const Profile = () => {
  const navigate = useNavigate();

    return (
        <>
        <div className="sphdr">
            <h2>👤 Admin Profile</h2>
            <button className="btn btn-g sm" onClick={() => alert('Close profile')}>✕</button>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'14px',padding:'16px',background:'var(--s2)',borderRadius:'12px',marginBottom:'20px',border:'1px solid var(--border)'}}>
            <div style={{width:'52px',height:'52px',borderRadius:'12px',background:'var(--yellow)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',fontWeight:'900',color:'var(--bg)',flexShrink:'0'}}>SA</div>
            <div>
            <div style={{fontWeight:'800',fontSize:'.95rem',color:'var(--text)'}}>Super Admin</div>
            <div style={{fontSize:'.75rem',color:'var(--muted2)'}}>admin@salonhub.com</div>
            <div style={{fontSize:'.65rem',color:'var(--yellow)',marginTop:'3px',fontWeight:'700'}}>● Online</div>
            </div>
        </div>
        <div style={{marginBottom:'20px'}}>
            <div style={{fontSize:'.65rem',fontWeight:'800',color:'var(--muted2)',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:'12px'}}>Profile Details</div>
            <div className="pf-field"><label>Display Name</label><input className="pf-inp" id="pf-name" defaultValue="Super Admin"/></div>
            <div className="pf-field"><label>Email</label><input className="pf-inp" type="email" id="pf-email" defaultValue="admin@salonhub.com"/></div>
            <div className="pf-field"><label>Platform Fee (%)</label><input className="pf-inp" type="number" id="pf-fee" defaultValue="10"/></div>
            <div className="pf-field"><label>Timezone</label><select className="pf-inp" id="pf-tz"><option>UTC</option><option>EST</option><option>PST</option><option>IST</option></select></div>
            <button className="btn btn-p sm" onClick={() => alert('Save profile')} style={{marginTop:'4px'}}>Save Changes</button>
        </div>
        <div style={{borderTop:'1px solid var(--border)',paddingTop:'18px',marginBottom:'18px'}}>
            <div style={{fontSize:'.65rem',fontWeight:'800',color:'var(--muted2)',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:'12px'}}>Change Password</div>
            <div className="pf-field"><label>Current Password</label><input className="pf-inp" type="password" id="sp1" placeholder="••••••••"/></div>
            <div className="pf-field"><label>New Password</label><input className="pf-inp" type="password" id="sp2" placeholder="••••••••"/></div>
            <div className="pf-field"><label>Confirm Password</label><input className="pf-inp" type="password" id="sp3" placeholder="••••••••"/></div>
            <button className="btn btn-g sm" onClick={() => alert('Change password')} style={{marginTop:'4px'}}>Update Password</button>
        </div>
        <div style={{borderTop:'1px solid var(--border)',paddingTop:'18px',marginBottom:'18px'}}>
            <div style={{fontSize:'.65rem',fontWeight:'800',color:'var(--muted2)',letterSpacing:'.12em',textTransform:'uppercase',marginBottom:'12px'}}>Platform Controls</div>
            <div id="settogs"></div>
        </div>
        <button className="btn btn-d" style={{width:'100%',justifyContent:'center',marginTop:'4px'}} onClick={() => alert('Logout')}>🚪 Sign Out</button>
        </>
    );
}

export default Profile;