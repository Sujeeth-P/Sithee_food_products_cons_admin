import React, { useState, useEffect, useContext, useMemo } from 'react';
import './Orders.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { StoreContext } from '../../context/StoreContext';

const Orders = ({ url }) => {
  const { token } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNext: false,
    hasPrev: false
  });

  const statusOptions = [
    'All',
    'Pending',
    'Processing', 
    'Shipped',
    'Delivered',
    'Cancelled'
  ];

  // Convert backend status to frontend display status
  const formatStatusForDisplay = (status) => {
    if (!status) return 'Pending'; // Default for undefined/null status
    
    const statusMapping = {
      'pending': 'Pending',
      'approved': 'Processing', // Map approved back to Processing for display
      'processing': 'Processing', // Also handle direct processing status
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    
    const normalizedStatus = status.toLowerCase().trim();
    const mappedStatus = statusMapping[normalizedStatus] || 'Pending';
    return mappedStatus;
  };

  const fetchOrders = async (page = 1, limit = 50) => {  // Increased default limit to 50
    try {
      const response = await axios.get(`${url}/api/orders?page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
        
        // Debug: Log order statuses to help identify issues
        // console.log('Fetched orders:', response.data.orders.length);
        const statusCounts = {};
        response.data.orders.forEach(order => {
          const rawStatus = order.status;
          const displayStatus = formatStatusForDisplay(rawStatus);
          statusCounts[`${rawStatus} -> ${displayStatus}`] = (statusCounts[`${rawStatus} -> ${displayStatus}`] || 0) + 1;
        });
        console.log('Status distribution:', statusCounts);
        console.log('Pagination info:', response.data.pagination);
      } else {
        toast.error("Failed to fetch orders");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Send the original status - backend will handle the mapping
      const response = await axios.put(`${url}/api/orders/${orderId}/status`, {
        status: newStatus
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        toast.success("Order status updated successfully");
        fetchOrders(pagination.currentPage); // Refresh the current page
      } else {
        toast.error("Failed to update order status");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to update order status");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setLoading(true);
      fetchOrders(newPage);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const response = await axios.put(`${url}/api/orders/${orderId}/status`, {
        status: 'Cancelled'  // Use capital C to match backend expectation
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        toast.success("Order cancelled successfully");
        setSelectedOrder({ ...selectedOrder, status: 'cancelled' }); // Update modal
        fetchOrders(); // Refresh the orders
        closeOrderModal(); // Close the modal after successful cancellation
      } else {
        toast.error("Failed to cancel order");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to cancel order");
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
      
      // Set up automatic refresh every 10 seconds to detect new orders
      const interval = setInterval(fetchOrders, 10000);
      
      // Cleanup interval on component unmount
      return () => clearInterval(interval);
    }
  }, [token]);

  // Filter orders based on status using useMemo
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (filterStatus === 'All') return true;
      
      // Convert backend status to frontend for comparison
      const displayStatus = formatStatusForDisplay(order.status);
      return displayStatus === filterStatus;
    });
  }, [orders, filterStatus]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    // Handle undefined, null, or NaN values
    if (price === undefined || price === null || isNaN(price)) {
      return '₹0.00';
    }
    
    // Format with rupee symbol instead of LKR
    const formattedPrice = Number(price).toFixed(2);
    return `₹${formattedPrice}`;
  };

  const getStatusClass = (status) => {
    return `status-${status.toLowerCase()}`;
  };

  // Calculate order statistics
  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      other: 0
    };

    orders.forEach(order => {
      const displayStatus = formatStatusForDisplay(order.status);
      switch (displayStatus) {
        case 'Pending':
          stats.pending++;
          break;
        case 'Processing':
          stats.processing++;
          break;
        case 'Shipped':
          stats.shipped++;
          break;
        case 'Delivered':
          stats.delivered++;
          break;
        case 'Cancelled':
          stats.cancelled++;
          break;
        default:
          stats.other++;
          break;
      }
    });

    return stats;
  };

  // Calculate order statistics whenever orders change
  const orderStats = useMemo(() => getOrderStats(), [orders]);

  const openOrderModal = (order) => {
    console.log('Selected order data:', order);
    console.log('userDetails:', order.userDetails);
    console.log('userId:', order.userId);
    console.log('Phone from userDetails:', order.userDetails?.phone);
    console.log('Phone from userId:', order.userId?.phone);
    console.log('Final phone value:', order.userDetails?.phone || order.userId?.phone || 'N/A');
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='orders-page'>
      <div className="orders-container">
        {/* Header */}
        <div className="orders-header">
          <div className="orders-title">
            <span className="icon">📦</span>
            <h2>Order Management</h2>
          </div>
          <div className="orders-stats">
            <div className="stat-item">
              {/* <p className="stat-number">{orderStats.total}</p>
              <p className="stat-label">Total Orders</p> */}
            </div>
            <div className="stat-item">
              {/* <p className="stat-number">{orderStats.pending}</p>
              <p className="stat-label">Pending</p> */}
            </div>
            <div className="stat-item">
              {/* <p className="stat-number">{orderStats.processing}</p>
              <p className="stat-label">Processing</p> */}
            </div>
            <div className="stat-item">
              {/* <p className="stat-number">{orderStats.shipped}</p>
              <p className="stat-label">Shipped</p> */}
            </div>
            <div className="stat-item">
              {/* <p className="stat-number">{orderStats.delivered}</p>
              <p className="stat-label">Delivered</p> */}
            </div>  
            <div className="stat-item">
              {/* <p className="stat-number">{orderStats.cancelled}</p>
              <p className="stat-label">Cancelled</p> */}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="orders-controls">
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button
            className="refresh-btn"
            onClick={() => fetchOrders(pagination.currentPage)}
          >
            <span>🔄</span>
            Refresh
          </button>
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📦</div>
            <h3>No orders found</h3>
            <p>There are no orders matching your current filters.</p>
          </div>
        ) : (
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <span className="order-id">#{order._id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td>
                      <div className="customer-info">
                        <span className="customer-name">{order.userId?.name || 'Guest User'}</span>
                        <span className="customer-email">{order.userId?.email || 'No email'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="order-items">
                        {order.items?.slice(0, 2).map((item, index) => (
                          <div key={index} className="order-item">
                            <span className="item-name">{item.name}</span>
                            <span className="item-quantity">x{item.quantity}</span>
                          </div>
                        ))}
                        {order.items?.length > 2 && (
                          <div className="order-item">
                            <span>+ {order.items.length - 2} more items</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="order-total">{formatPrice(order.finalAmount || order.totalAmount || order.total)}</span>
                    </td>
                    <td>
                      <span className="order-date">{formatDate(order.createdAt)}</span>
                    </td>
                    <td>
                      <select
                        className={`order-status ${getStatusClass(order.status)}`}
                        value={formatStatusForDisplay(order.status)}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                      >
                        {statusOptions.slice(1).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="order-actions">
                        <button 
                          className="action-btn view-btn"
                          onClick={() => openOrderModal(order)}
                          title="View Details"
                        >
                          view
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            <div className="pagination-container">
              <div className="pagination-info">
                <span>
                  Showing {orders.length} of {pagination.totalOrders} orders 
                  (Page {pagination.currentPage} of {pagination.totalPages})
                </span>
              </div>
              <div className="pagination-controls">
                <button 
                  className="pagination-btn"
                  onClick={() => handlePageChange(1)}
                  disabled={!pagination.hasPrev}
                >
                  First
                </button>
                <button 
                  className="pagination-btn"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </button>
                <span className="page-indicator">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button 
                  className="pagination-btn"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </button>
                <button 
                  className="pagination-btn"
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={!pagination.hasNext}
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="order-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Order Details</h3>
              <button className="close-btn" onClick={closeOrderModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="order-info">
                <p><strong>Order ID:</strong> #{selectedOrder._id}</p>
                <p><strong>Customer:</strong> {selectedOrder.userId?.name || selectedOrder.userDetails?.name || 'Guest User'}</p>
                <p><strong>Email:</strong> {selectedOrder.userId?.email || selectedOrder.userDetails?.email || 'No email'}</p>
                <p><strong>Phone:</strong> {selectedOrder.userDetails?.phone || selectedOrder.userId?.phone || 'N/A'}</p>
                <p><strong>Status:</strong> {formatStatusForDisplay(selectedOrder.status)}</p>
                <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                <p><strong>Total:</strong> {formatPrice(selectedOrder.finalAmount || selectedOrder.totalAmount || selectedOrder.total)}</p>
                <p><strong>Payment Method:</strong> {(() => {
                  const paymentMethod = selectedOrder.paymentMethod;
                  if (paymentMethod === 'cod') return 'Cash on Delivery';
                  if (paymentMethod === 'upi') return 'UPI Payment';
                  if (paymentMethod === 'card') return 'Credit/Debit Card';
                  return paymentMethod || 'Not specified';
                })()}</p>
              </div>

              <div className="order-items-details">
                <h4>Items Ordered:</h4>
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="item-detail">
                    <span>{item.name}</span>
                    <span>Quantity: {item.quantity}</span>
                    <span>Price: {formatPrice(item.price)}</span>
                  </div>
                ))}
              </div>

              {selectedOrder.deliveryAddress && (
                <div className="delivery-address">
                  <h4>Delivery Address:</h4>
                  <p>{selectedOrder.deliveryAddress}</p>
                </div>
              )}

              {selectedOrder.shippingAddress && (
                <div className="shipping-address">
                  <h4>Shipping Address:</h4>
                  <p>
                    {selectedOrder.shippingAddress.street}<br />
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}<br />
                    {selectedOrder.shippingAddress.country || 'India'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-close" 
                onClick={closeOrderModal}
              >
                Close
              </button>
              {formatStatusForDisplay(selectedOrder.status) !== 'Cancelled' && 
               formatStatusForDisplay(selectedOrder.status) !== 'Delivered' && (
                <button 
                  className="btn-cancel" 
                  onClick={() => cancelOrder(selectedOrder._id)}
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
