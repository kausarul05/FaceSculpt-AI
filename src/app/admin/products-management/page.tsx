"use client";

import { useState, useEffect } from "react";
import { CircleCheck, CircleX, Pencil, Plus, Trash } from "lucide-react";
import { apiRequest } from "@/app/lib/api";

interface Product {
  id: number;
  title: string;
  description: string;
  old_price: string;
  new_price: string;
  billing_cycle: string;
  add_link: string;
  created_at: string;
  dynamic_discount_percentage: number;
}

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    old_price: "",
    new_price: "",
    billing_cycle: "monthly",
    add_link: ""
  });

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(
        "GET", 
        "/product/api/Product-all/", 
        null,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );

      if (response.results) {
        setProducts(response.results || []);
      } else if (response.error) {
        console.error("Error fetching products:", response.error);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Create product
  const handleCreate = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const response = await apiRequest(
        "POST", 
        "/product/api/Product-all/", 
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );

      if (response) {
        // Close modal and refresh data
        setShowCreateModal(false);
        resetForm();
        await fetchProducts(); // Wait for refresh
      } else if (response.error) {
        console.error("Failed to create product:", response.error);
        alert("Failed to create product: " + response.error);
      }
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Error creating product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update product
  const handleUpdate = async () => {
    if (!selectedProduct || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await apiRequest(
        "PUT", 
        `/product/api/Product-all/${selectedProduct.id}/`, 
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );

    //   console.log("Update response:", response);

      if (response) {
        // Close modal and refresh data
        setShowEditModal(false);
        resetForm();
        await fetchProducts(); // Wait for refresh
      } else if (response.error) {
        console.error("Failed to update product:", response.error);
        alert("Failed to update product: " + response.error);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Error updating product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete product
  const handleDelete = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await apiRequest(
        "DELETE", 
        `/product/api/Product-all/${productId}/`, 
        null,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );

      if (response.data || !response.error) {
        await fetchProducts(); // Wait for refresh
      } else if (response.error) {
        console.error("Failed to delete product:", response.error);
        alert("Failed to delete product: " + response.error);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product");
    }
  };

  // Edit product handler
  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      old_price: product.old_price,
      new_price: product.new_price,
      billing_cycle: product.billing_cycle,
      add_link: product.add_link
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      old_price: "",
      new_price: "",
      billing_cycle: "monthly",
      add_link: ""
    });
    setSelectedProduct(null);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate discount for display
  const calculateDiscount = (oldPrice: string, newPrice: string) => {
    const old = parseFloat(oldPrice);
    const newP = parseFloat(newPrice);
    const discount = old - newP;
    return `US$ ${discount.toFixed(0)} OFF*`;
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A2131] text-white px-6 py-8">
        <div className="bg-[#0D314B] rounded-lg p-6 h-screen flex items-center justify-center">
          <div className="text-white">Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A2131] text-white px-6 py-8">
      <div className="bg-[#0D314B] rounded-lg p-6 h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-[#1b3b56] pb-4">
          <h1 className="text-lg font-semibold">Products Management</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center cursor-pointer gap-2 bg-[#007ED6] hover:bg-[#006bb3] text-white px-4 py-2 rounded-lg font-medium"
          >
            <Plus size={18} /> Create New Product
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-[#0A2131] border border-[#1b4b70] rounded-xl p-6 relative"
            >
              <h4 className="text-[18px] font-semibold text-white mb-6 text-center">
                {product.title}
                <span className="text-[#007ED6]"> Plus</span>
              </h4>

              <p className="text-gray-400 text-sm mb-5 text-center">
                <span className="line-through text-white">US$ {product.old_price}</span>{" "}
                <span className="text-[#007ED6] font-medium">
                  {calculateDiscount(product.old_price, product.new_price)}
                </span>
              </p>

              <p className="text-[#007ED6] text-3xl font-bold mb-6 text-center">
                US${product.new_price}
                <span className="text-gray-300 text-sm font-normal">
                  /{product.billing_cycle}
                </span>
              </p>

              <ul className="space-y-4 text-sm mb-4">
                {product.description.split('\n').map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CircleCheck size={14} className="text-[#007ED6]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => handleEdit(product)}
                  className="p-2 rounded-full border border-[#007ED6] hover:bg-[#12446a]"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(product.id)}
                  className="p-2 rounded-full border border-[#EB4335] hover:bg-[#12446a]"
                >
                  <Trash size={16} className="text-[#EB4335]" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
            <div className="bg-[#0e304a] border border-[#1b4b70] rounded-lg p-6 w-[90%] max-w-2xl text-white">
              <h2 className="text-xl font-semibold mb-6">
                Create New Product
              </h2>

              {/* Plan Name & Price Row */}
              <div className="grid gap-6 mb-6">
                <div className="w-full">
                  <div className="flex w-full gap-4">
                    <div className="flex-1 ">
                      <label className="block text-sm font-medium mb-2">Add Title</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter Title name"
                        className="bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400 w-full"
                      />
                    </div>
                    <div className="flex-1 ">
                      <label className="block text-sm font-medium mb-2">Price</label>
                      <input
                        type="text"
                        name="new_price"
                        value={formData.new_price}
                        onChange={handleInputChange}
                        placeholder="Enter price"
                        className="bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400 w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Cycle & Old Price Row */}
              <div className="mb-6">
                <div>
                  <div className="flex w-full gap-4">
                    <div className="flex-1 ">
                      <label className="block text-sm font-medium mb-2">Billing Cycle</label>
                      <select
                        name="billing_cycle"
                        value={formData.billing_cycle}
                        onChange={handleInputChange}
                        className="bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] w-full"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div className="flex-1 ">
                      <label className="block text-sm font-medium mb-2">Old Price</label>
                      <input
                        type="text"
                        name="old_price"
                        value={formData.old_price}
                        onChange={handleInputChange}
                        placeholder="Enter Old Price"
                        className="bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400 w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Link */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Add Link</label>
                <input
                  type="text"
                  name="add_link"
                  value={formData.add_link}
                  onChange={handleInputChange}
                  placeholder="Enter Add Link"
                  className="bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400 w-full"
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Type here... (Use new lines for features)"
                  rows={4}
                  className="w-full bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-[#1b4b70]">
                <button
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-transparent border cursor-pointer border-gray-500 hover:bg-gray-500/20 text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-[#007ED6] cursor-pointer hover:bg-[#006bb3] rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Creating..." : "Create Product"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
            <div className="bg-[#0e304a] border border-[#1b4b70] rounded-lg p-6 w-[90%] max-w-2xl text-white">
              <h2 className="text-xl font-semibold mb-6">
                Edit Product
              </h2>

              {/* Plan Name & Price Row */}
              <div className="grid gap-6 mb-6">
                <div className="w-full">
                  <div className="flex w-full gap-4">
                    <div className="flex-1 ">
                      <label className="block text-sm font-medium mb-2">Add Title</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter Add Title"
                        className="bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400 w-full"
                      />
                    </div>
                    <div className="flex-1 ">
                      <label className="block text-sm font-medium mb-2">Price</label>
                      <input
                        type="text"
                        name="new_price"
                        value={formData.new_price}
                        onChange={handleInputChange}
                        placeholder="25.99"
                        className="bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400 w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Cycle & Old Price Row */}
              <div className="mb-6">
                <div>
                  <div className="flex w-full gap-4">
                    <div className="flex-1 ">
                      <label className="block text-sm font-medium mb-2">Billing Cycle</label>
                      <select
                        name="billing_cycle"
                        value={formData.billing_cycle}
                        onChange={handleInputChange}
                        className="bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] w-full"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div className="flex-1 ">
                      <label className="block text-sm font-medium mb-2">Old Price</label>
                      <input
                        type="text"
                        name="old_price"
                        value={formData.old_price}
                        onChange={handleInputChange}
                        placeholder="29.99"
                        className="bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400 w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Link */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Add Link</label>
                <input
                  type="text"
                  name="add_link"
                  value={formData.add_link}
                  onChange={handleInputChange}
                  placeholder="Enter Your Product Detail link"
                  className="bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400 w-full"
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Type here... (Use new lines for features)"
                  rows={4}
                  className="w-full bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-[#1b4b70]">
                <button
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-transparent border cursor-pointer border-gray-500 hover:bg-gray-500/20 text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-[#007ED6] cursor-pointer hover:bg-[#006bb3] rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Updating..." : "Confirm Update"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}