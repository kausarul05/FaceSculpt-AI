'use client'

import { apiRequest } from '@/app/lib/api';
import { ChevronLeft, ChevronRight, CircleQuestionMark, Search, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface User {
    id: number;
    name: string;
    phone_number: string;
    date_joined: string;
    is_active: boolean;
    current_plan: string;
    scans_count?: number;
    Fullname?: string;
}

interface ApiResponse {
    success: boolean;
    code: number;
    message: string;
    timestamp: number;
    data: {
        count: number;
        next: string | null;
        previous: string | null;
        results: User[];
    };
}

export default function UserManagement() {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<number | null>(null);
    const itemsPerPage = 10;

    // Fetch users from API
    const fetchUsers = async () => {
        try {
            setLoading(true);
            
            // Build query parameters
            let endpoint = `/api/dashboard/users/?page=${currentPage}&page_size=${itemsPerPage}`;
            
            // Add search parameter if search term exists
            if (searchTerm) {
                endpoint += `&search=${encodeURIComponent(searchTerm)}`;
            }

            const data: ApiResponse = await apiRequest("GET", endpoint, null, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`
                }
            });

            console.log("Users API response:", data);

            if (data.success && data.data) {
                // Map API response to our User interface
                const formattedUsers: User[] = data.data.results.map((user: unknown) => ({
                    id: user.id,
                    name: user.name,
                    phone_number: user.phone_number,
                    date_joined: user.date_joined,
                    is_active: user.is_active,
                    current_plan: user.current_plan,
                    scans_count: user.scans_count,
                    Fullname: user.name // Using name as Fullname
                }));
                
                setUsers(formattedUsers);
                setTotalItems(data.data.count);
                setTotalPages(Math.ceil(data.data.count / itemsPerPage));
            } else {
                toast.error(data.message || 'Failed to fetch users');
                setUsers([]);
                setTotalItems(0);
                setTotalPages(0);
            }
        } catch (error: unknown) {
            console.error('Failed to fetch users:', error);
            toast.error(error.message || 'Failed to fetch users');
            setUsers([]);
            setTotalItems(0);
                setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    // Handle user removal (delete)
    const handleRemove = async (userId: number) => {
        try {
            setActionLoading(userId);
            
            // Make API call to delete user
            const response = await apiRequest(
                "DELETE", 
                `/api/dashboard/users/${userId}/`, 
                null,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`
                    }
                }
            );

            console.log("Delete response:", response);

            if (response.success) {
                toast.success('User removed successfully');
                // Refresh user list
                await fetchUsers();
            } else {
                toast.error(response.message || 'Failed to remove user');
            }
        } catch (error: unknown) {
            console.error('Failed to remove user:', error);
            toast.error(error.message || 'Failed to remove user');
        } finally {
            setActionLoading(null);
            setShowDeleteModal(false);
            setUserToDelete(null);
        }
    };

    // Handle user block/unblock
    const handleToggleBlock = async (userId: number, currentStatus: boolean) => {
        try {
            setActionLoading(userId);
            
            const endpoint = `/api/dashboard/users/${userId}/block/`;
            const response = await apiRequest(
                "POST", 
                endpoint, 
                { is_active: !currentStatus },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`
                    }
                }
            );

            console.log("Block response:", response);

            if (response.success) {
                toast.success(`User ${currentStatus ? 'blocked' : 'unblocked'} successfully`);
                // Refresh user list
                await fetchUsers();
            } else {
                toast.error(response.message || `Failed to ${currentStatus ? 'block' : 'unblock'} user`);
            }
        } catch (error: unknown) {
            console.error('Failed to toggle block status:', error);
            toast.error(error.message || 'Failed to update user status');
        } finally {
            setActionLoading(null);
        }
    };

    // View user details
    const handleView = (user: User) => {
        setSelectedUser(user);
        setShowViewModal(true);
    };

    // Open delete confirmation modal
    const handleRemoveClick = (userId: number) => {
        setUserToDelete(userId);
        setShowDeleteModal(true);
    };

    // Close modals
    const closeModals = () => {
        setShowViewModal(false);
        setShowDeleteModal(false);
        setSelectedUser(null);
        setUserToDelete(null);
    };

    // Get subscription color based on plan
    const getSubscriptionColor = (plan: string) => {
        const planLower = plan.toLowerCase();
        
        if (planLower.includes('free')) {
            return 'bg-gray-500/20 text-gray-300 border border-gray-500';
        } else if (planLower.includes('premium')) {
            return 'bg-blue-500/20 text-blue-300 border border-blue-500';
        } else if (planLower.includes('monthly')) {
            return 'bg-green-500/20 text-green-300 border border-green-500';
        } else if (planLower.includes('yearly') || planLower.includes('annual')) {
            return 'bg-purple-500/20 text-purple-300 border border-purple-500';
        } else if (planLower.includes('lifetime')) {
            return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500';
        } else {
            return 'bg-gray-500/20 text-gray-300 border border-gray-500';
        }
    };

    // Format plan name for display
    const formatPlanName = (plan: string) => {
        if (!plan || plan.toLowerCase() === 'free') return 'Free';
        
        // Remove underscores and make it readable
        return plan
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Fetch users when page or search term changes
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchUsers();
        }, 500); // Debounce search by 500ms

        return () => clearTimeout(debounceTimer);
    }, [currentPage, searchTerm]);

    // Handle page change
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return pageNumbers;
    };

    // Format date to match your design
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    // Format time for detailed view
    const formatDateTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    // Calculate display values for current page
    const startIndexDisplay = (currentPage - 1) * itemsPerPage;
    const endIndexDisplay = Math.min(startIndexDisplay + itemsPerPage, totalItems);

    return (
        <div className="min-h-screen bg-[#000000] p-6">
            <div className='bg-[#1A2028] rounded-lg'>
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6">
                    <h1 className="text-[20px] font-semibold text-[#F9FAFB]">User Management</h1>
                    <div className='relative w-full md:w-auto'>
                        <input
                            type="text"
                            placeholder="Search by name or phone number"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                // Reset to page 1 on new search
                                if (e.target.value !== searchTerm) {
                                    setCurrentPage(1);
                                }
                            }}
                            className="w-full md:w-80 px-4 py-2 border border-[#60A5FB] rounded-lg bg-transparent text-white placeholder-gray-400"
                        />
                        <Search size={18} className='absolute right-4 top-3 cursor-pointer text-white' />
                    </div>
                </div>

                {/* Table Container */}
                <div className="rounded-lg shadow-sm border border-[#60A5FB66] overflow-hidden">
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-[#60A5FB66] bg-[#60A5FB29]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        NO
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Phone Number
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Registration Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Subscription Plan
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-white">
                                            <div className="flex justify-center items-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                                <span className="ml-3">Loading users...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-white">
                                            {searchTerm ? 'No users found matching your search' : 'No users found'}
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user, index) => (
                                        <tr key={user.id} className="border-b border-[#60A5FB66] hover:bg-[#60A5FB10]">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {startIndexDisplay + index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                                {user.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#F9FAFB]">
                                                {user.phone_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {formatDate(user.date_joined)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded ${getSubscriptionColor(user.current_plan)}`}>
                                                    {formatPlanName(user.current_plan)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded ${user.is_active
                                                        ? 'bg-green-500/20 text-green-300 border border-green-500'
                                                        : 'bg-red-500/20 text-red-300 border border-red-500'
                                                    }`}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => handleView(user)}
                                                        className="bg-[#60A5FB29] px-3 py-1 text-[#60A5FB] rounded cursor-pointer font-medium transition-colors hover:bg-[#60A5FB40] flex items-center gap-1 text-sm"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveClick(user.id)}
                                                        disabled={actionLoading === user.id}
                                                        className="bg-[#551214] px-3 py-1 text-[#FE4D4F] rounded cursor-pointer font-medium transition-colors hover:bg-[#55121480] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 0 && (
                        <div className="px-6 py-4 border-t border-[#60A5FB66]">
                            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                                <div className="text-sm text-white">
                                    Showing{' '}
                                    <span className="font-medium">
                                        {totalItems === 0 ? 0 : startIndexDisplay + 1}
                                    </span>{' '}
                                    to{' '}
                                    <span className="font-medium">
                                        {endIndexDisplay}
                                    </span>{' '}
                                    of{' '}
                                    <span className="font-medium">{totalItems}</span> users
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1 || loading}
                                        className={`w-10 h-10 font-bold text-sm rounded transition-colors cursor-pointer flex items-center justify-center ${currentPage === 1 || loading
                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#60A5FB29] text-white hover:bg-[#60A5FB40]'
                                            }`}
                                    >
                                        <ChevronLeft size={20} className='font-bold' />
                                    </button>

                                    {getPageNumbers().map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            disabled={loading}
                                            className={`w-10 h-10 font-bold text-sm rounded transition-colors cursor-pointer ${currentPage === page
                                                ? 'bg-[#60A5FB] text-white'
                                                : 'bg-[#60A5FB29] text-white hover:bg-[#60A5FB40]'
                                                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages || totalPages === 0 || loading}
                                        className={`w-10 h-10 font-bold cursor-pointer text-sm rounded transition-colors flex items-center justify-center ${currentPage === totalPages || totalPages === 0 || loading
                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#60A5FB29] text-white hover:bg-[#60A5FB40]'
                                            }`}
                                    >
                                        <ChevronRight size={20} className='font-bold' />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* View User Modal */}
            {showViewModal && selectedUser && (
                <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1A2028] rounded-lg w-full max-w-md border border-[#60A5FB] max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-[#60A5FB66]">
                            <h3 className="text-lg font-semibold text-white">User Details</h3>
                            <button
                                onClick={closeModals}
                                className="text-gray-400 hover:text-white cursor-pointer"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-20 h-20 bg-[#60A5FB29] rounded-full flex items-center justify-center">
                                    <span className="text-white text-2xl font-bold">
                                        {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold text-xl">{selectedUser.name}</h4>
                                    <p className="text-gray-400 text-sm">ID: {selectedUser.id}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-gray-400 text-sm">User ID</label>
                                        <p className="text-white font-medium">{selectedUser.id}</p>
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-sm">Status</label>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${selectedUser.is_active
                                                ? 'bg-green-500/20 text-green-300'
                                                : 'bg-red-500/20 text-red-300'
                                            }`}>
                                            {selectedUser.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-gray-400 text-sm">Phone Number</label>
                                    <p className="text-white">{selectedUser.phone_number}</p>
                                </div>

                                <div>
                                    <label className="text-gray-400 text-sm">Registration Date</label>
                                    <p className="text-white">{formatDateTime(selectedUser.date_joined)}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-gray-400 text-sm">Subscription Plan</label>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getSubscriptionColor(selectedUser.current_plan)}`}>
                                            {formatPlanName(selectedUser.current_plan)}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-sm">Scans Count</label>
                                        <p className="text-white font-medium">{selectedUser.scans_count || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[#60A5FB66]">
                            <div className="flex space-x-3">
                                
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        handleRemoveClick(selectedUser.id);
                                    }}
                                    className="flex-1 bg-[#551214] text-[#FE4D4F] py-2 rounded font-medium transition-colors hover:bg-[#55121480]"
                                >
                                    Remove User
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
                    <div className="relative bg-[#1A2028] rounded-lg w-full max-w-md border border-[#60A5FB]">
                        <button
                            onClick={closeModals}
                            className="text-gray-400 hover:text-white absolute right-4 top-4 cursor-pointer"
                        >
                            <X size={24} />
                        </button>
                        <div className='text-center p-6'>
                            <CircleQuestionMark size={80} color='#FE4D4F' className='mx-auto mb-4' />
                            <h3 className="text-lg font-semibold text-white mb-2">Remove this Account?</h3>
                            <p className="text-white mb-4">
                                Once deleted, this user will be permanently removed from the system
                            </p>
                            <p className="text-gray-400 mb-6 text-sm">
                                This action cannot be undone. Are you sure you want to proceed?
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={closeModals}
                                    className="flex-1 px-4 py-2 text-[#60A5FB] border border-[#60A5FB] rounded-lg hover:bg-[#60A5FB10] transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => userToDelete && handleRemove(userToDelete)}
                                    disabled={actionLoading !== null}
                                    className="flex-1 bg-[#FE4D4F] text-white px-4 py-2 rounded-lg font-medium transition-colors hover:bg-[#FE4D4F]/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {actionLoading ? 'Removing...' : 'Remove'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}