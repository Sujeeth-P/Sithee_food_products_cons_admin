import React, { useContext } from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./components/Login/Login";
import { StoreContext } from "./context/StoreContext";
import { SocketProvider } from "./context/SocketContext";

const App = () => {
  const url = import.meta.env.VITE_URL || 'https://sithee-food-products-cons-server.onrender.com';
  const { token, admin } = useContext(StoreContext);

  // If not authenticated, show login
  if (!token || !admin) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
        <ToastContainer />
        <Routes>
          <Route path="*" element={<Login url={url} />} />
        </Routes>
      </div>
    );
  }

  return (
    <SocketProvider>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff8f0 0%, #ffe4d1 100%)', display: 'flex', flexDirection: 'column' }}>
        <ToastContainer />
        <Navbar />
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <main style={{ flex: 1, overflow: 'auto' }}>
            <Routes>
              <Route path="/" element={<Dashboard url={url} />} />
              <Route path="/dashboard" element={<Dashboard url={url} />} />
              <Route path="/add" element={<Add url={url} />} />
              <Route path="/list" element={<List url={url} />} />
              <Route path="/orders" element={<Orders url={url} />} />
              <Route path="*" element={<Dashboard url={url} />} />
            </Routes>
          </main>
        </div>
      </div>
    </SocketProvider>
  );
};

export default App;
