import React, { useState, useEffect } from 'react';
import './List.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Search, Edit, Trash2, Package, DollarSign, Eye } from 'lucide-react';

const List = ({ url }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);
  const [editModal, setEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: ''
  });

  const categories = [
    "All",
    "Flour Products",
    "Rava & Sooji", 
    "Noodles & Vermicelli",
    "Specialty Products"
  ];

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${url}/api/products?limit=100`); // Increase limit to fetch all products
      console.log('Products API response:', response.data); // Debug log
      if (response.data.success) {
        setProducts(response.data.data || response.data.products || []); // Try both data and products fields
      } else {
        toast.error("Failed to fetch products");
        setProducts([]); // Set empty array on failure
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to fetch products");
      setProducts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await axios.delete(`${url}/api/products/${productId}`);
        if (response.data.success) {
          toast.success("Product deleted successfully");
          fetchProducts(); // Refresh the list
        } else {
          toast.error("Failed to delete product");
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error("Failed to delete product");
      }
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      image: product.image || ''
    });
    setEditModal(true);
  };

  const closeEditModal = () => {
    setEditModal(false);
    setEditingProduct(null);
    setEditForm({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      image: ''
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        name: editForm.name,
        description: editForm.description,
        price: parseFloat(editForm.price),
        category: editForm.category,
        stock: parseInt(editForm.stock),
        image: editForm.image
      };

      const response = await axios.put(`${url}/api/products/${editingProduct._id}`, updateData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success("Product updated successfully");
        fetchProducts();
        closeEditModal();
      } else {
        toast.error("Failed to update product");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to update product");
    }
  };

  // Get appropriate icon for product category
  const getCategoryIcon = (category) => {
    const icons = {
      'Flour Products': '🌾',
      'Rava & Sooji': '🥣',
      'Noodles & Vermicelli': '🍜',
      'Gram Flour Varieties': '🫘',
      'Specialty Products': '🌿',
      'default': '📦'
    };
    return icons[category] || icons.default;
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search term and category
  const filteredProducts = (products || []).filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Debug logging
  console.log('Current products state:', products);
  console.log('Products length:', products?.length);
  console.log('Filtered products:', filteredProducts);
  console.log('Filtered products length:', filteredProducts.length);

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const getStockStatus = (stock) => {
    if (stock === 0) return { status: 'Out of Stock', class: 'stock-out' };
    if (stock < 10) return { status: 'Low Stock', class: 'stock-low' };
    return { status: 'In Stock', class: 'stock-in' };
  };

  const formatPrice = (price) => {
    return `${parseFloat(price).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="list-page">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='list-page'>
      <div className="list-container">
        {/* Header */}
        <div className="list-header">
          <div className="list-title">
            <span className="icon">📋</span>
            <h2>Product Management</h2>
          </div>
          <div className="list-stats">
            <div className="stat-item">
              <p className="stat-number">{products.length}</p>
              <p className="stat-label">Total Products</p>
            </div>
            <div className="stat-item">
              <p className="stat-number">{products.filter(p => p.stock > 0).length}</p>
              <p className="stat-label">In Stock</p>
            </div>
            <div className="stat-item">
              <p className="stat-number">{products.filter(p => p.stock === 0).length}</p>
              <p className="stat-label">Out of Stock</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="list-controls">
          <div className="search-box">
            <span className="search-icon">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search products..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Products Grid */}
        {currentProducts.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📦</div>
            <h3>No products found</h3>
            <p>Try adjusting your search criteria or add new products.</p>
          </div>
        ) : (
          <>
            <div className="products-grid">
              {currentProducts.map((product) => {
                const stockInfo = getStockStatus(product.stock);
                return (
                  <div key={product._id} className="product-card">
                    <div className="product-image-container">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="product-image"
                          loading="lazy"
                          onError={(e) => {
                            console.log(`Failed to load image for ${product.name}:`, product.image);
                            e.target.style.display = 'none';
                            e.target.parentNode.querySelector('.product-image-placeholder').style.display = 'flex';
                          }}
                          onLoad={(e) => {
                            e.target.parentNode.querySelector('.product-image-placeholder').style.display = 'none';
                          }}
                        />
                      ) : null}
                      <div 
                        className="product-image-placeholder" 
                        style={{ display: 'flex' }}
                      >
                        <div className="placeholder-content">
                          <div className="placeholder-icon">{getCategoryIcon(product.category)}</div>
                          <div className="placeholder-text">No Image</div>
                        </div>
                      </div>
                    </div>
                    <div className="product-content">
                      <div className="product-header">
                        <div>
                          <h3 className="product-name">{product.name}</h3>
                          <span className="product-category">{product.category}</span>
                        </div>
                      </div>
                      
                      <p className="product-price">{formatPrice(product.price)}</p>
                      <p className="product-description">{product.description}</p>
                      
                      <div className="product-meta">
                        <div className="stock-info">
                          <span>Stock: {product.stock}</span>
                          <span className={`stock-status ${stockInfo.class}`}>
                            {stockInfo.status}
                          </span>
                        </div>
                        <div className="product-actions">
                          <button 
                            className="action-btn edit-btn"
                            onClick={() => openEditModal(product)}
                            title="Edit Product"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="action-btn delete-btn"
                            onClick={() => removeProduct(product._id)}
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>
                
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
                
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Product Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button className="close-btn" onClick={closeEditModal}>×</button>
            </div>
            <form onSubmit={updateProduct} className="edit-form">
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  rows="3"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={editForm.price}
                    onChange={handleEditFormChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    name="stock"
                    value={editForm.stock}
                    onChange={handleEditFormChange}
                    min="0"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Category</label>
                <select
                  name="category"
                  value={editForm.category}
                  onChange={handleEditFormChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.filter(cat => cat !== "All").map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Product Image URL</label>
                <input
                  type="url"
                  name="image"
                  value={editForm.image}
                  onChange={handleEditFormChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="update-btn">
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default List;
