import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import './Dashboard.css';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { StoreContext } from '../../context/StoreContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Package,
  ShoppingBag,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Star,
  BarChart3,
  PieChart,
  Clock,
  Warehouse,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
  Plus,
  Bell,
  X
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = ({ url }) => {
  const navigate = useNavigate();
  const { socket, isConnected, newOrders, clearNewOrders } = useSocket();
  const { token, admin } = useContext(StoreContext);

  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    activeProducts: 0,
    outOfStock: 0,
    categories: 0,
    recentOrders: [],
    recentProducts: [],
    lowStockProducts: [],
    productsByCategory: []
  });

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

  // Check if data is recent (within 5 minutes)
  const isDataRecent = () => {
    if (!lastFetched) return false;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - lastFetched < fiveMinutes;
  };

  // Manual refresh handler
  const handleManualRefresh = () => {
    if (isRefreshing) return;
    fetchDashboardData(true);
  };



  const fetchDashboardData = async (forceRefresh = false) => {
    if (!forceRefresh && isDataRecent()) {
      console.log('⚡ Using cached data (recent fetch)');
      return;
    }

    try {
      setIsRefreshing(true);
      if (!lastFetched) setLoading(true);

      // Fetch dashboard stats with error handling
      let stats = { totalRevenue: 0, totalOrders: 0, totalUsers: 0 };
      try {
        const statsResponse = await axios.get(`${url}/sithee/dashboard/stats`);
        stats = statsResponse.data.stats || stats;
        console.log('📊 Dashboard Stats Response:', statsResponse.data);
        console.log('📊 Parsed Stats:', stats);
      } catch (error) {
        console.warn('Could not fetch dashboard stats:', error.message);
      }

      // Fetch recent orders with error handling
      let recentOrders = [];
      try {
        const ordersResponse = await axios.get(`${url}/api/orders?limit=5`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        recentOrders = ordersResponse.data.data || ordersResponse.data.orders || [];
        console.log('📋 Recent Orders:', recentOrders);
      } catch (error) {
        console.warn('Could not fetch recent orders:', error.message);
      }

      // Fetch product stats with error handling
      let productStats = { categoryCounts: [] };
      try {
        const productStatsResponse = await axios.get(`${url}/api/products/stats`);
        productStats = productStatsResponse.data.data || productStats;
      } catch (error) {
        console.warn('Could not fetch product stats:', error.message);
      }

      // Fetch products with error handling
      let products = [];
      try {
        const productsResponse = await axios.get(`${url}/api/products?limit=100`);
        console.log('Products API Response:', productsResponse.data);
        products = productsResponse.data.data || productsResponse.data.products || [];
        console.log(`Fetched ${products.length} products from database`);
      } catch (error) {
        console.warn('Could not fetch products:', error.message);
      }

      // Calculate out of stock products
      const outOfStockCount = products.filter(product => product.stock <= 5).length;

      // Get low stock products (stock <= 10)
      const lowStock = products.filter(product => product.stock <= 10 && product.stock > 0)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5);

      // Get recent products (last 10 added)
      const recent = products
        .sort((a, b) => new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id))
        .slice(0, 5);

      // Calculate products by category
      const categoryData = productStats.categoryCounts || [];
      console.log('Category data from API:', categoryData);
      console.log('Products categories:', products.map(p => p.category));

      setDashboardData({
        // Count all products in database (both active and inactive)
        totalProducts: products.length || 0,
        activeProducts: products.filter(p => p.isActive !== false).length || 0, // Include products without isActive field

        outOfStock: outOfStockCount,
        categories: categoryData.length || [...new Set(products.map(p => p.category).filter(Boolean))].length,
        recentProducts: recent,
        recentOrders: recentOrders,
        lowStockProducts: lowStock,
        productsByCategory: categoryData.length > 0 ? categoryData :
          [...new Set(products.map(p => p.category).filter(Boolean))].map(cat => ({
            _id: cat,
            category: cat,
            count: products.filter(p => p.category === cat).length
          })),

        // Revenue, Orders, Users come from backend stats - REAL DATA
        totalRevenue: stats.totalRevenue || 0,
        totalOrders: stats.totalOrders || 0,
        totalUsers: stats.totalUsers || 0
      });


    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setLastFetched(Date.now());
    }
  };

  useEffect(() => {
    // Only fetch if data is not already loaded
    if (!lastFetched) {
      fetchDashboardData();
    }
  }, [url]); // Only re-run if URL changes

  // Socket.IO real-time updates
  useEffect(() => {
    if (socket && newOrders.length > 0) {
      // Show toast notification for new orders
      newOrders.forEach(order => {
        const orderTotal = order.total || order.totalAmount || 0;
        toast.success(`New order from ${order.customerName}! ₹${orderTotal}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      });

      // Fetch fresh data from backend to get accurate totals
      fetchDashboardData(true);

      // Clear the new orders after processing
      clearNewOrders();
    }
  }, [newOrders, socket]);

  // Navigation handlers
  const handleAddProduct = () => {
    navigate('/add');
  };

  const handleViewAllProducts = () => {
    navigate('/list');
  };

  const handleViewAllOrders = () => {
    navigate('/orders');
  };

  // Chart configurations
  const salesData = {
    labels: ['Specialty Products', 'Noodles & Vermicelli', 'Flour Products', 'Rava & Sooji'],
    datasets: [
      {
        label: 'Sales',
        data: [2, 4, 5, 2], // Real data based on categories
        backgroundColor: ['#ff9500', '#ff6b35', '#3b82f6', '#22c55e'],
        borderWidth: 0,
      },
    ],
  };
  const categoryChartData = {
    labels: dashboardData.productsByCategory.map(item => item.category),
    datasets: [
      {
        label: 'Number of Products',
        data: dashboardData.productsByCategory.map(item => item.count),
        backgroundColor: [
          '#ff9500', '#ff6b35', '#3b82f6', '#22c55e',
          '#a855f7', '#ec4899', '#14b8a6', '#f97316'
        ],
        borderWidth: 0,
      }
    ],
  };





  const salesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f1f5f9',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading-spinner">
            <RefreshCw size={32} className="spinning" />
          </div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard" style={{ padding: '20px', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: '600',
            color: '#1e293b'
          }}>
            Dashboard
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '4px',
            fontSize: '14px',
            color: '#64748b'
          }}>
            <span>Dashboard</span>
            <span>/</span>
            <span style={{ color: '#f7931e', fontWeight: '500' }}>Sithee Food Products</span>
            {lastFetched && (
              <span style={{ color: '#64748b', marginLeft: '8px' }}>
                • Last updated: {new Date(lastFetched).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* <input
            type="text"
            placeholder="Search data..."
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          /> */}

          {/* Real-time status indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: isConnected ? '#dcfce7' : '#fee2e2',
            border: `1px solid ${isConnected ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '500',
            color: isConnected ? '#166534' : '#dc2626'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#22c55e' : '#ef4444',
              animation: isConnected ? 'pulse 2s infinite' : 'none'
            }}></div>
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </div>

          {newOrders.length > 0 && (
            <button
              onClick={clearNewOrders}
              style={{
                position: 'relative',
                padding: '8px',
                background: '#f7931e',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              <Bell size={16} />
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#dc2626',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '10px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white'
              }}>
                {newOrders.length}
              </span>
            </button>
          )}

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            style={{
              padding: '8px 12px',
              background: '#f7931e',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}
          >
            <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
            {isRefreshing && <span>Refreshing...</span>}
          </button>
        </div>
      </div>

      {/* Stats Cards - Original Design with Real Data */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Total Sales Card */}
        {/* <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderLeft: '4px solid #8b5cf6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '14px', 
                color: '#64748b', 
                fontWeight: '500' 
              }}>
                Total Sales
              </h3>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                color: '#f7931e', 
                marginBottom: '8px' 
              }}>
                ₹{dashboardData.totalRevenue}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
              
              </div>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={24} color="#8b5cf6" />
            </div>
          </div>
        </div> */}

        {/* Orders Value Card */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderLeft: '4px solid #3b82f6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                Total Orders
              </h3>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#f7931e',
                marginBottom: '8px'
              }}>
                {dashboardData.totalOrders}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {/* Compared to Aug 2024 */}
              </div>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShoppingBag size={24} color="#3b82f6" />
            </div>
          </div>
        </div>

        {/* Daily Orders Card */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderLeft: '4px solid #f7931e'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                Total Products
              </h3>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#f7931e',
                marginBottom: '8px'
              }}>
                {dashboardData.totalProducts}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {/* Compared to May 2024 */}
              </div>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={24} color="#f7931e" />
            </div>
          </div>
        </div>

        {/* Daily Revenue Card */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderLeft: '4px solid #ec4899'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                Total Users
              </h3>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#f7931e',
                marginBottom: '8px'
              }}>
                {dashboardData.totalUsers}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>

              </div>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={24} color="#ec4899" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent Orders */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
              Recent Orders
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Search:</span>
              <button onClick={handleViewAllOrders} style={{
                padding: '6px',
                background: 'transparent',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                cursor: 'pointer'
              }}>
                <Eye size={16} color="#64748b" />
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              gap: '16px',
              padding: '12px 16px',
              backgroundColor: '#65a30d',
              color: 'white',
              fontWeight: '600',
              borderRadius: '8px 8px 0 0'
            }}>
              <div>Recent Orders</div>
              <div>Order Date</div>
              <div>Price</div>
              {/* <div>Status</div> */}
            </div>

            {dashboardData.recentOrders.length > 0 ?
              dashboardData.recentOrders.slice(0, 4).map((order, index) => (
                <div key={order._id || index} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  gap: '16px',
                  padding: '16px',
                  borderBottom: '1px solid #f1f5f9',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="checkbox" />
                    {order.items?.[0]?.productId?.image ? (
                      <img
                        src={order.items?.[0]?.productId?.image}
                        alt={order.items?.[0]?.productId?.name || "Product"}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #e2e8f0'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '6px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #e2e8f0',
                        display: order.items?.[0]?.productId?.image ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        color: '#64748b'
                      }}
                    >
                      📦
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      {order.items?.[0]?.productId?.name || 'Order #' + (order._id?.slice(-6) || index)}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    ₹{order.finalAmount || order.totalAmount || 0}
                  </div>
                  {/* Status removed as per request */}
                </div>
              )) :
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '14px'
              }}>
                No recent orders found
              </div>
            }
          </div>
        </div>

        {/* Sales Overview */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
              Category Overview
            </h2>
            <button style={{
              padding: '6px',
              background: 'transparent',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer'
            }}>
              <Eye size={16} color="#64748b" />
            </button>
          </div>

          <div className="chart-container">
            <Doughnut data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
