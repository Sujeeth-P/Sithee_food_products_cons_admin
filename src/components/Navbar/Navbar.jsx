import React, { useContext } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { LogOut, LogIn, Store } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const { token, admin, setAdmin, setToken } = useContext(StoreContext);
  
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    setToken("");
    setAdmin(false);
    toast.success("Logout Successfully");
    navigate("/");
  };

  return (
    <div className="navbar">
      <div className="logo" onClick={() => navigate("/add")}>
        <div className="logo-icon">
          <Store size={24} />
        </div>
        <div className="logo-text">
          <h2>Sithee Admin</h2>
          <span>Food Products Management</span>
        </div>
      </div>
      
      <div className="navbar-right">
        {token && admin && (
          <div className="admin-welcome">
            <span>Welcome, Admin</span>
            {/* <span className="admin-badge">ADMIN</span> */}
          </div>
        )}
        
        {token && admin ? (
          <button className="logout-btn" onClick={logout}>
            <LogOut size={18} />
            Logout
          </button>
        ) : (
          <button className="logout-btn" onClick={() => navigate("/")}>
            <LogIn size={18} />
            Login
          </button>
        )}
        
        <div className="profile-icon">
          <Store size={20} />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
