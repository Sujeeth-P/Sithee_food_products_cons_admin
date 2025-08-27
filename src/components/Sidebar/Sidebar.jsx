import React from 'react';
import './Sidebar.css';
import { assets } from '../../assets/assets';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Plus,
  List,
  ShoppingCart,
  Package
} from 'lucide-react';

const Sidebar = () => {
  return (
    <div className='sidebar'>
      <div className="sidebar-header">
        <h3>Admin Dashboard</h3>
        <p>Manage your food products</p>
      </div>
      
      <div className="sidebar-options">
        <NavLink to='/dashboard' className="sidebar-option">
          <span className="sidebar-icon">
            <LayoutDashboard size={20} />
          </span>
          <span className="sidebar-text">Dashboard</span>
        </NavLink>
        
        <NavLink to='/add' className="sidebar-option">
          <span className="sidebar-icon">
            <Plus size={20} />
          </span>
          <span className="sidebar-text">Add Products</span>
        </NavLink>
        
        <NavLink to='/list' className="sidebar-option">
          <span className="sidebar-icon">
            <List size={20} />
          </span>
          <span className="sidebar-text">Product List</span>
        </NavLink>
        
        <NavLink to='/orders' className="sidebar-option">
          <span className="sidebar-icon">
            <ShoppingCart size={20} />
          </span>
          <span className="sidebar-text">Orders</span>
        </NavLink>
      </div>
      
      {/* <div className="sidebar-stats">
        <h4>Quick Stats</h4>
        <p className="stat-number">25</p>
        <p>Total Products</p>
      </div> */}
    </div>
  );
};

export default Sidebar;
