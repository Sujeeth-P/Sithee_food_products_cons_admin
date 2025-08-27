import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newOrders, setNewOrders] = useState([]);

  useEffect(() => {
    // Connect to Socket.IO server
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'https://sithee-food-products-cons-server.onrender.com', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setIsConnected(true);
      
      // Join admin room to receive order notifications
      newSocket.emit('join-admin');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      setIsConnected(false);
    });

    // Listen for new orders
    newSocket.on('new-order', (orderData) => {
      console.log('New order received:', orderData);
      setNewOrders(prev => [orderData, ...prev]);
      
      // Show notification - handle both total and totalAmount fields
      const orderTotal = orderData.total || orderData.totalAmount || 0;
      if (window.Notification && Notification.permission === 'granted') {
        new Notification('New Order Received!', {
          body: `Order from ${orderData.customerName} - ₹${orderTotal}`,
          icon: '/favicon.ico'
        });
      }
    });

    // Listen for order status updates
    newSocket.on('order-status-updated', (updateData) => {
      console.log('Order status updated:', updateData);
      
      if (window.Notification && Notification.permission === 'granted') {
        new Notification('Order Status Updated', {
          body: `Order #${updateData.orderId?.slice(-6)} status changed to ${updateData.newStatus}`,
          icon: '/favicon.ico'
        });
      }
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const clearNewOrders = () => {
    setNewOrders([]);
  };

  const value = {
    socket,
    isConnected,
    newOrders,
    clearNewOrders
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
