'use client'

import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import userImage from "@/../public/images/profile.jpg"
import Image from 'next/image';
import { apiRequest } from '@/app/lib/api';
import { toast } from 'react-toastify';

interface User {
    id: number;
    Fullname: string;
    email: string;
    phone_number: string;
    date_joined: string;
    is_active?: boolean;
    subscription: string;
}

interface ApiResponse {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    results: User[];
}

interface BlockResponse {
    detail: string;
}

interface DeleteResponse {
    detail: string;
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

    // Fake data for demonstration with phone numbers and subscriptions
    const fakeUsers: User[] = [
        {
            id: 455656885,
            Fullname: 'Savannah Nguyen',
            email: 'savannah.nguyen@example.com',
            phone_number: '(207) 555-0199',
            date_joined: '2025-01-20',
            is_active: true,
            subscription: 'Monthly'
        },
        {
            id: 2,
            Fullname: 'Annette Black',
            email: 'annette.black@example.com',
            phone_number: '(305) 555-0123',
            date_joined: '2025-02-15',
            is_active: true,
            subscription: 'Yearly'
        },
        {
            id: 3,
            Fullname: 'Cody Fisher',
            email: 'cody.fisher@example.com',
            phone_number: '(415) 555-0187',
            date_joined: '2025-03-10',
            is_active: false,
            subscription: '6 Month'
        },
        {
            id: 4,
            Fullname: 'Brooklyn Simmons',
            email: 'brooklyn.simmons@example.com',
            phone_number: '(212) 555-0165',
            date_joined: '2025-04-09',
            is_active: true,
            subscription: 'Free'
        },
        {
            id: 5,
            Fullname: 'Robert Fox',
            email: 'robert.fox@example.com',
            phone_number: '(312) 555-0143',
            date_joined: '2025-01-12',
            is_active: true,
            subscription: 'Monthly'
        },
        {
            id: 6,
            Fullname: 'Darlene Robertson',
            email: 'darlene.robertson@example.com',
            phone_number: '(404) 555-0178',
            date_joined: '2025-02-28',
            is_active: false,
            subscription: 'Yearly'
        },
        {
            id: 7,
            Fullname: 'Jacob Jones',
            email: 'jacob.jones@example.com',
            phone_number: '(503) 555-0134',
            date_joined: '2025-03-15',
            is_active: true,
            subscription: '6 Month'
        },
        {
            id: 8,
            Fullname: 'Kristin Watson',
            email: 'kristin.watson@example.com',
            phone_number: '(617) 555-0192',
            date_joined: '2025-04-22',
            is_active: true,
            subscription: 'Monthly'
        },
        {
            id: 9,
            Fullname: 'Ralph Edwards',
            email: 'ralph.edwards@example.com',
            phone_number: '(214) 555-0156',
            date_joined: '2025-01-30',
            is_active: false,
            subscription: 'Free'
        },
        {
            id: 10,
            Fullname: 'Leslie Alexander',
            email: 'leslie.alexander@example.com',
            phone_number: '(702) 555-0112',
            date_joined: '2025-02-18',
            is_active: true,
            subscription: 'Yearly'
        }
    ];

    // Subscription type colors
    const getSubscriptionColor = (subscription: string) => {
        switch (subscription.toLowerCase()) {
            case 'monthly':
                return 'bg-blue-500/20 text-blue-300 border border-blue-500';
            case 'yearly':
                return 'bg-green-500/20 text-green-300 border border-green-500';
            case '6 month':
                return 'bg-purple-500/20 text-purple-300 border border-purple-500';
            case 'free':
                return 'bg-gray-500/20 text-gray-300 border border-gray-500';
            default:
                return 'bg-gray-500/20 text-gray-300 border border-gray-500';
        }
    };

    // Fake data handlers
    const handleRemove = async (userId: number) => {
        setActionLoading(userId);
        // Simulate API delay
        setTimeout(() => {
            setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
            setTotalItems(prev => prev - 1);
            toast.success('User removed successfully');
            setActionLoading(null);
            setShowDeleteModal(false);
            setUserToDelete(null);
            
            // If current page becomes empty, go to previous page
            if (users.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        }, 1000);
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

    // Filter users based on search term
    const filteredUsers = searchTerm 
        ? fakeUsers.filter(user => 
            user.Fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone_number.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : fakeUsers;

    // Calculate pagination
    const totalFilteredItems = filteredUsers.length;
    const totalFilteredPages = Math.ceil(totalFilteredItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    // Initial load with fake data
    useEffect(() => {
        setUsers(paginatedUsers);
        setTotalItems(totalFilteredItems);
        setTotalPages(totalFilteredPages);
    }, [currentPage, searchTerm]);

    // Debounced search - fetch new data when search term changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (currentPage === 1) {
                setUsers(paginatedUsers);
                setTotalItems(totalFilteredItems);
                setTotalPages(totalFilteredPages);
            } else {
                setCurrentPage(1);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

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
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Get display name
    const getDisplayName = (user: User) => {
        return user.Fullname || user.email.split('@')[0] || 'Unknown User';
    };

    // Calculate display values for current page
    const startIndexDisplay = (currentPage - 1) * itemsPerPage;
    const endIndexDisplay = Math.min(startIndexDisplay + itemsPerPage, totalItems);

    return (
        <div className="min-h-screen bg-[#000000] p-6">
            <div className='bg-[#1A2028] rounded-lg'>
                {/* Header */}
                <div className="flex justify-between items-center p-6">
                    <h1 className="text-[20px] font-semibold text-[#F9FAFB]">User Management</h1>
                    <div className='relative'>
                        <input
                            type="text"
                            placeholder="Search by name, email or phone"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-[#007ED6] rounded-lg focus:ring-2 focus:ring-[#007ED6] focus:border-[#007ED6] bg-transparent text-white"
                        />
                        <Search size={18} className='absolute right-4 top-3 cursor-pointer text-white' />
                    </div>
                </div>

                {/* Table Container */}
                <div className="rounded-lg shadow-sm border border-[#007ED6] overflow-hidden">
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-[#007ED6]">
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
                                        Subscriptions
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-white">
                                            Loading users...
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-white">
                                            {searchTerm ? 'No users found matching your search' : 'No users found'}
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user, index) => (
                                        <tr key={user.id} className="">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {startIndexDisplay + index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                                <div className='flex items-center gap-3'>
                                                    <Image
                                                        src={userImage}
                                                        alt={getDisplayName(user)}
                                                        width={120}
                                                        height={60}
                                                        className='w-10 h-10 object-fill rounded'
                                                    />
                                                    {getDisplayName(user)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#F9FAFB]">
                                                {user.phone_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {formatDate(user.date_joined)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getSubscriptionColor(user.subscription)}`}
                                                >
                                                    {user.subscription}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-3">
                                                    <button 
                                                        onClick={() => handleView(user)}
                                                        className="bg-[#60A5FB29] px-4 py-1 text-[#60A5FB] rounded cursor-pointer font-medium transition-colors hover:bg-[#60A5FB40] flex items-center gap-2"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveClick(user.id)}
                                                        disabled={actionLoading === user.id}
                                                        className="bg-[#551214] px-4 py-1 text-[#FE4D4F] rounded cursor-pointer font-medium transition-colors hover:bg-[#55121480] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                    >
                                                        {actionLoading === user.id ? (
                                                            <>
                                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Removing...
                                                            </>
                                                        ) : (
                                                            'Remove'
                                                        )}
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
                    <div className="px-6 py-4 border-t border-[#007ED6]">
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
                                <span className="font-medium">{totalItems}</span> results
                            </div>

                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1 || loading}
                                    className={`w-10 h-10 font-bold text-sm rounded transition-colors cursor-pointer ${currentPage === 1 || loading
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    <ChevronLeft size={24} color='black' className='font-bold mx-auto' />
                                </button>

                                {getPageNumbers().map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        disabled={loading}
                                        className={`w-10 h-10 font-bold text-sm rounded transition-colors cursor-pointer ${currentPage === page
                                            ? 'bg-[#245FE7] text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || totalPages === 0 || loading}
                                    className={`w-10 h-10 font-bold cursor-pointer text-sm rounded transition-colors ${currentPage === totalPages || totalPages === 0 || loading
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    <ChevronRight size={24} color='black' className='font-bold mx-auto' />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* View User Modal */}
            {showViewModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1A2028] rounded-lg w-full max-w-md border border-[#60A5FB]">
                        <div className="flex justify-between items-center p-6 border-b border-[#60A5FB]">
                            <h3 className="text-lg font-semibold text-white">User Details</h3>
                            <button 
                                onClick={closeModals}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <Image
                                    src={userImage}
                                    alt={selectedUser.Fullname}
                                    width={80}
                                    height={80}
                                    className='w-20 h-20 object-fill rounded'
                                />
                                <div>
                                    <h4 className="text-white font-semibold text-lg">{selectedUser.Fullname}</h4>
                                    <p className="text-gray-400">User ID: {selectedUser.id}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="text-gray-400 text-sm">Full name</label>
                                    <p className="text-white">{selectedUser.Fullname}</p>
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm">Phone number</label>
                                    <p className="text-white">{selectedUser.phone_number}</p>
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm">Registration Date</label>
                                    <p className="text-white">{formatDate(selectedUser.date_joined)}</p>
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm">Subscriptions</label>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getSubscriptionColor(selectedUser.subscription)}`}>
                                        {selectedUser.subscription}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end p-6 border-t border-[#60A5FB]">
                            <button
                                onClick={closeModals}
                                className="bg-[#60A5FB] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#3b82f6] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1A2028] rounded-lg w-full max-w-md border border-[#FE4D4F]">
                        <div className="flex justify-between items-center p-6 border-b border-[#FE4D4F]">
                            <h3 className="text-lg font-semibold text-white">Delete this Account?</h3>
                            <button 
                                onClick={closeModals}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-white mb-4">
                                Once deleted, this user will permanently be removed from the system
                            </p>
                            <p className="text-gray-400 text-sm mb-6">What would you like to do next?</p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={closeModals}
                                    className="px-6 py-2 text-white border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => userToDelete && handleRemove(userToDelete)}
                                    disabled={actionLoading !== null}
                                    className="bg-[#FE4D4F] text-white px-6 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}