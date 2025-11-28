"use client";

import { useState, useEffect } from "react";
import { CircleCheck, CircleX, Pencil, Plus, Trash, X } from "lucide-react";
import { apiRequest } from '@/app/lib/api';
import { toast } from "react-toastify";

interface Feature {
    id: number;
    description: string;
}

interface Subscription {
    id: number;
    title: string;
    Description: string;
    price: string;
    billing_cycle: string;
    features: Feature[];
}

interface ApiResponse {
    success: boolean;
    message: string;
    data: Subscription[];
}

interface CreateSubscriptionData {
    title: string;
    Description: string;
    price: string;
    billing_cycle: string;
    features: { description: string }[];
}

export default function PlansManagement() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<Subscription | null>(null);
    const [createLoading, setCreateLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        title: "",
        Description: "",
        price: "",
        billing_cycle: "monthly",
    });
    const [features, setFeatures] = useState([{ description: "" }]);

    // Fetch subscriptions from API
    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const response: ApiResponse = await apiRequest("GET", "/payment/subscriptions", null, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`
                }
            });

            if (response.success) {
                setSubscriptions(response.data);
            } else {
                console.error('Failed to fetch subscriptions:', response.message);
                setSubscriptions([]);
            }
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
            setSubscriptions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const handleEdit = (subscription: Subscription) => {
        setSelectedPlan(subscription);
        setFormData({
            title: subscription.title,
            Description: subscription.Description,
            price: subscription.price,
            billing_cycle: subscription.billing_cycle,
        });
        setFeatures(subscription.features.length > 0 
            ? subscription.features.map(f => ({ description: f.description }))
            : [{ description: "" }]
        );
        setShowEditModal(true);
    };

    const handleDelete = async (subscriptionId: number) => {
        if (!confirm('Are you sure you want to delete this subscription?')) {
            return;
        }

        try {
            await apiRequest("DELETE", `/payment/subscriptions/${subscriptionId}/`, null, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`
                }
            });
            
            setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId));
            toast.success('Subscription deleted successfully');
            
        } catch (error: any) {
            console.error('Failed to delete subscription:', error);
            toast.error(error?.error || 'Failed to delete subscription');
        }
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle feature input changes
    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...features];
        newFeatures[index].description = value;
        setFeatures(newFeatures);
    };

    // Add new feature field
    const addFeature = () => {
        setFeatures([...features, { description: "" }]);
    };

    // Remove feature field
    const removeFeature = (index: number) => {
        if (features.length > 1) {
            const newFeatures = features.filter((_, i) => i !== index);
            setFeatures(newFeatures);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            title: "",
            Description: "",
            price: "",
            billing_cycle: "monthly",
        });
        setFeatures([{ description: "" }]);
    };

    // Handle create subscription
    const handleCreateSubscription = async () => {
        if (!formData.title || !formData.Description || !formData.price) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Filter out empty features
        const validFeatures = features.filter(feature => feature.description.trim() !== "");

        const subscriptionData: CreateSubscriptionData = {
            title: formData.title,
            Description: formData.Description,
            price: formData.price,
            billing_cycle: formData.billing_cycle,
            features: validFeatures
        };

        try {
            setCreateLoading(true);
            const response = await apiRequest("POST", "/payment/subscriptions/", subscriptionData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.success) {
                toast.success('Subscription created successfully');
                setShowCreateModal(false);
                resetForm();
                fetchSubscriptions(); // Refresh the list
            } else {
                toast.error(response.message || 'Failed to create subscription');
            }
        } catch (error: any) {
            console.error('Failed to create subscription:', error);
            toast.error(error?.error || 'Failed to create subscription');
        } finally {
            setCreateLoading(false);
        }
    };

    // Handle update subscription
    const handleUpdateSubscription = async () => {
        if (!selectedPlan || !formData.title || !formData.Description || !formData.price) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Filter out empty features
        const validFeatures = features.filter(feature => feature.description.trim() !== "");

        const subscriptionData: CreateSubscriptionData = {
            title: formData.title,
            Description: formData.Description,
            price: formData.price,
            billing_cycle: formData.billing_cycle,
            features: validFeatures
        };

        try {
            setEditLoading(true);
            const response = await apiRequest("PUT", `/payment/subscriptions/${selectedPlan.id}/`, subscriptionData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.success) {
                toast.success('Subscription updated successfully');
                setShowEditModal(false);
                fetchSubscriptions(); // Refresh the list
            } else {
                toast.error(response.message || 'Failed to update subscription');
            }
        } catch (error: any) {
            console.error('Failed to update subscription:', error);
            toast.error(error?.error || 'Failed to update subscription');
        } finally {
            setEditLoading(false);
        }
    };

    // Map API data to your feature structure
    const getFeaturesList = (subscription: Subscription) => {
        const apiFeatures = subscription.features.map(feature => ({
            text: feature.description,
            available: true
        }));
        return apiFeatures;
    };

    // Get display duration
    const getDisplayDuration = (billingCycle: string) => {
        return billingCycle === 'monthly' ? 'month' : 'year';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A2131] text-white px-6 py-8">
                <div className="bg-[#0D314B] rounded-lg p-6 h-screen flex items-center justify-center">
                    <div className="text-white">Loading subscriptions...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#0A2131] text-white px-6 py-8">
            <div className="bg-[#0D314B] rounded-lg p-6 min-h-screen">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 border-b border-[#1b3b56] pb-4">
                    <h1 className="text-lg font-semibold">Plans Management</h1>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowCreateModal(true);
                        }}
                        className="flex items-center cursor-pointer gap-2 bg-[#007ED6] hover:bg-[#006bb3] text-white px-4 py-2 rounded-lg font-medium"
                    >
                        <Plus size={18} /> Create New Subscriptions
                    </button>
                </div>

                {/* Plans */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {subscriptions.map((subscription) => {
                        const featuresList = getFeaturesList(subscription);
                        return (
                            <div
                                key={subscription.id}
                                className="bg-[#0A2131] border border-[#1b4b70] rounded-xl p-6 relative"
                            >
                                <h2 className="text-lg font-semibold mb-2 text-[#00aaff]">
                                    {subscription.title}
                                </h2>
                                <p className="text-sm text-gray-300 mb-4">{subscription.Description}</p>

                                <p className="text-3xl font-bold mb-4">
                                    ${subscription.price}
                                    <span className="text-base font-medium text-gray-400">
                                        /{getDisplayDuration(subscription.billing_cycle)}
                                    </span>
                                </p>

                                <ul className="space-y-2 text-sm mb-4">
                                    {featuresList.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <CircleCheck size={14} className="text-[#007ED6]" />
                                            {feature.text}
                                        </li>
                                    ))}
                                </ul>

                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        onClick={() => handleEdit(subscription)}
                                        className="p-2 rounded-full border border-[#007ED6] hover:bg-[#12446a]"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(subscription.id)}
                                        className="p-2 rounded-full border border-[#EB4335] hover:bg-[#12446a]"
                                    >
                                        <Trash size={16} className="text-[#EB4335]" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
                        <div className="bg-[#0e304a] border border-[#1b4b70] rounded-lg p-6 w-full max-w-2xl text-white max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold">Create Subscription</h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 hover:bg-[#1b4b70] rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Plan Name & Price Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Plan Name *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="Enter plan name"
                                        className="bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400 w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Price *</label>
                                    <input
                                        type="text"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="Enter price"
                                        className="bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400 w-full"
                                    />
                                </div>
                            </div>

                            {/* Billing Cycle */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Billing Cycle *</label>
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

                            {/* Description */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Description *</label>
                                <textarea
                                    name="Description"
                                    value={formData.Description}
                                    onChange={handleInputChange}
                                    placeholder="Type description here..."
                                    rows={3}
                                    className="w-full bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400 resize-none"
                                />
                            </div>

                            {/* Features */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium">Features</label>
                                    <button
                                        type="button"
                                        onClick={addFeature}
                                        className="text-sm text-[#007ED6] hover:text-[#006bb3] flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Add Feature
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {features.map((feature, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={feature.description}
                                                onChange={(e) => handleFeatureChange(index, e.target.value)}
                                                placeholder={`Feature ${index + 1}`}
                                                className="flex-1 bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400"
                                            />
                                            {features.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeFeature(index)}
                                                    className="p-2 text-[#EB4335] hover:bg-[#1b4b70] rounded-lg"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-4 pt-6 border-t border-[#1b4b70]">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={createLoading}
                                    className="px-8 py-3 bg-transparent border cursor-pointer border-gray-500 hover:bg-gray-500/20 text-sm rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateSubscription}
                                    disabled={createLoading}
                                    className="px-8 py-3 bg-[#007ED6] cursor-pointer hover:bg-[#006bb3] rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {createLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Subscription'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {showEditModal && selectedPlan && (
                    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
                        <div className="bg-[#0e304a] border border-[#1b4b70] rounded-lg p-6 w-full max-w-2xl text-white max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold">Edit Subscription</h2>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="p-2 hover:bg-[#1b4b70] rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Plan Name & Price Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Plan Name *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="Enter plan name"
                                        className="bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400 w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Price *</label>
                                    <input
                                        type="text"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="Enter price"
                                        className="bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400 w-full"
                                    />
                                </div>
                            </div>

                            {/* Billing Cycle */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Billing Cycle *</label>
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

                            {/* Description */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Description *</label>
                                <textarea
                                    name="Description"
                                    value={formData.Description}
                                    onChange={handleInputChange}
                                    placeholder="Type description here..."
                                    rows={3}
                                    className="w-full bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400 resize-none"
                                />
                            </div>

                            {/* Features */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium">Features</label>
                                    <button
                                        type="button"
                                        onClick={addFeature}
                                        className="text-sm text-[#007ED6] hover:text-[#006bb3] flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Add Feature
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {features.map((feature, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={feature.description}
                                                onChange={(e) => handleFeatureChange(index, e.target.value)}
                                                placeholder={`Feature ${index + 1}`}
                                                className="flex-1 bg-[#0A2131] border border-[#1b4b70] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#007ED6] placeholder-gray-400"
                                            />
                                            {features.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeFeature(index)}
                                                    className="p-2 text-[#EB4335] hover:bg-[#1b4b70] rounded-lg"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-4 pt-6 border-t border-[#1b4b70]">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    disabled={editLoading}
                                    className="px-8 py-3 bg-transparent border cursor-pointer border-gray-500 hover:bg-gray-500/20 text-sm rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateSubscription}
                                    disabled={editLoading}
                                    className="px-8 py-3 bg-[#007ED6] cursor-pointer hover:bg-[#006bb3] rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {editLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Subscription'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}