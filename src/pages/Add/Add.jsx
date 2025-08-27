import React, { useState } from 'react';
import './Add.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const Add = ({ url }) => {
  const [image, setImage] = useState(null);
  const [data, setData] = useState({
    name: "",
    fullName: "",
    description: "",
    price: "",
    category: "Flour Products",
    stock: "",
    weight: "",
    features: ""
  });
  const [loading, setLoading] = useState(false);

  const categories = [
    "Flour Products",
    "Rava & Sooji", 
    "Noodles & Vermicelli",
    "Specialty Products"
  ];

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({ ...data, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("fullName", data.fullName);
    formData.append("description", data.description);
    formData.append("price", Number(data.price));
    formData.append("category", data.category);
    formData.append("stock", Number(data.stock));
    formData.append("weight", data.weight);
    
    // Convert features string to array and append each feature individually
    if (data.features.trim()) {
      const featuresArray = data.features.split(',').map(feature => feature.trim()).filter(feature => feature);
      featuresArray.forEach(feature => {
        formData.append("features[]", feature);
      });
    }
    
    formData.append("image", image);

    try {
      toast.info("Uploading product and image...");
      const response = await axios.post(`${url}/api/products/add`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setData({
          name: "",
          fullName: "",
          description: "",
          price: "",
          category: "Flour Products",
          stock: "",
          weight: "",
          features: ""
        });
        setImage(null);
        toast.success("Product added successfully with image!");
      } else {
        toast.error(response.data.message || "Failed to add product");
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to add product. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image size should be less than 5MB");
        return;
      }
      setImage(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setImage(file);
    } else {
      toast.error("Please upload a valid image file");
    }
  };

  return (
    <div className='add-product'>
      <div className="add-product-container">
        <div className="add-product-header">
          <h2>Add New Product</h2>
          <p>Add delicious Sithee food products to your inventory</p>
        </div>

        <form className='add-product-form' onSubmit={onSubmitHandler}>
          {/* Image Upload Section */}
          <div className="form-section">
            <div className="section-title">
              {/* <span></span> */}
              Product Image
            </div>
            <div 
              className="upload-section"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('imageInput').click()}
            >
              {/* <div className="upload-icon">📸</div> */}
              <p className="upload-text">
                {image ? image.name : "Drag & drop an image here, or click to select"}
              </p>
              <button type="button" className="upload-button">
                Choose Image
              </button>
              <input
                id="imageInput"
                onChange={handleImageUpload}
                type="file"
                accept="image/*"
                hidden
                required={!image}
              />
            </div>
            {image && (
              <div className="image-preview">
                <img 
                  className="preview-image" 
                  src={URL.createObjectURL(image)} 
                  alt="Preview" 
                />
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="form-section">
            <div className="section-title">
              <span>📝</span>
              Basic Information
            </div>
            
            <div className="form-group">
              <label htmlFor="name">Product Name</label>
              <input
                onChange={onChangeHandler}
                value={data.name}
                type="text"
                name="name"
                id="name"
                placeholder="e.g., Ceylon Cinnamon"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="fullName">Full Product Name</label>
              <input
                onChange={onChangeHandler}
                value={data.fullName}
                type="text"
                name="fullName"
                id="fullName"
                placeholder="e.g., Ceylon Cinnamon Powder - Premium Quality"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                onChange={onChangeHandler}
                value={data.description}
                name="description"
                id="description"
                rows="4"
                placeholder="Describe your product, its ingredients, uses, and benefits..."
                className="form-input form-textarea"
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="features">Product Features</label>
              <input
                onChange={onChangeHandler}
                value={data.features}
                type="text"
                name="features"
                id="features"
                placeholder="e.g., Organic, Traditional Processing, Chemical Free (separate with commas)"
                className="form-input"
              />
              <small className="field-help">
                Enter features separated by commas. Example: "Organic, Traditional Processing, Chemical Free"
              </small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  onChange={onChangeHandler}
                  value={data.category}
                  name="category"
                  id="category"
                  className="form-input category-select"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="weight">Weight</label>
                <input
                  onChange={onChangeHandler}
                  value={data.weight}
                  type="text"
                  name="weight"
                  id="weight"
                  placeholder="e.g., 250g, 1kg, 500ml"
                  className="form-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="form-section">
            <div className="section-title">
              <span>💰</span>
              Pricing & Stock
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price</label>
                <div className="price-input-group">
                  {/* <span className="currency-symbol">Rs. 0.00</span> */}
                  <input
                    onChange={onChangeHandler}
                    value={data.price}
                    type="number"
                    name="price"
                    id="price"
                    placeholder="₹ 0.00"
                    className="form-input price-input"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="stock">Stock Quantity</label>
                <input
                  onChange={onChangeHandler}
                  value={data.stock}
                  type="number"
                  name="stock"
                  id="stock"
                  placeholder="Available quantity"
                  className="form-input"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          <div className="submit-section">
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner">⏳</span>
                  Uploading to Cloud...
                </>
              ) : (
                <>
                  {/* <span>✨</span> */}
                  Add Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Add;
