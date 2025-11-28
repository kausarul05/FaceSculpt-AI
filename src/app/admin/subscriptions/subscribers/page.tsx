'use client'

import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useMemo, useEffect } from 'react';
import userImage from "@/../public/images/profile.jpg"
import { apiRequest } from '@/app/lib/api';

interface User {
    id: number;
    password: string;
    last_login: string | null;
    is_superuser: boolean;
    first_name: string;
    last_name: string;
    is_staff: boolean;
    is_active: boolean;
    date_joined: string;
    email: string;
    Fullname: string;
    groups: any[];
    user_permissions: any[];
}

interface Subscription {
    id: number;
    title: string;
    Description: string;
    price: string;
    billing_cycle: string;
    features: Array<{
        id: number;
        description: string;
    }>;
}

interface Payment {
    id: number;
    user: User;
    subscription: Subscription;
    amount: string;
    transaction_id: string;
    invoice_id: string;
    status: string;
    payment_date: string;
    created_at: string;
    updated_at: string;
}

interface PaymentsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Payment[];
}

export default function Subscribers() {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSubscription] = useState('all');
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 10;

    // Fetch payments from API
    useEffect(() => {
        const fetchPayments = async () => {
            try {
                setLoading(true);
                const response = await apiRequest(
                    "GET", 
                    "/payment/payments/",
                    null,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("authToken")}`
                        }
                    }
                );

                console.log("Fetched payments:", response); // Debug log

                if (response.results) {
                    setPayments(response.results);
                } else {
                    console.error("No payments data found in response");
                    setPayments([]);
                }
            } catch (error) {
                console.error("Failed to fetch payments:", error);
                setPayments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, []);

    // Map API data to user structure
    const users = useMemo(() => {
        return payments.map((payment, index) => {
            const user = payment.user;
            const subscription = payment.subscription;
            
            // Format date
            const formatDate = (dateString: string) => {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            };

            // Determine subscription type based on price or title
            const getSubscriptionType = (sub: Subscription) => {
                const price = parseFloat(sub.price);
                if (price === 0) return "Basic Protection";
                if (price <= 14.99) return "Silver Protection";
                if (price <= 29.99) return "Gold Protection";
                return "Premium Protection";
            };

            return {
                id: payment.id,
                name: user.Fullname || `${user.first_name} ${user.last_name}`.trim() || `User ${user.id}`,
                email: user.email,
                registrationDate: formatDate(payment.payment_date),
                subscription: getSubscriptionType(subscription),
                image: userImage,
                originalData: payment
            };
        });
    }, [payments]);

    // Filter users based on search term and subscription filter
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSubscription = filterSubscription === 'all' ||
                user.subscription === filterSubscription;
            return matchesSearch && matchesSubscription;
        });
    }, [users, searchTerm, filterSubscription]);

    // Calculate pagination values
    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);

    // Reset to first page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterSubscription, users]);

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

        // Adjust if we're at the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return pageNumbers;
    };

    const handleBlock = (userId: number) => {
        console.log(`Block user ${userId}`);
        // Add your block logic here
    };

    const handleRemove = (userId: number) => {
        console.log(`Remove user ${userId}`);
        // Add your remove logic here
    };

    if (loading) {
        return (
            <div className="min-h-screen p-6">
                <div className='bg-[#0D314B] rounded-lg'>
                    <div className="flex justify-between items-center p-6">
                        <h1 className="text-[20px] font-semibold text-[#F9FAFB]">Subscribers</h1>
                        <div className='relative'>
                            <input
                                type="text"
                                placeholder="Search"
                                disabled
                                className="w-full px-4 py-2 border border-[#007ED6] rounded-lg focus:ring-2 focus:ring-[#007ED6] focus:border-[#007ED6] opacity-50"
                            />
                            <Search size={18} className='absolute right-4 top-3 cursor-pointer' />
                        </div>
                    </div>
                    <div className="flex justify-center items-center py-12">
                        <p className="text-white">Loading subscribers...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen  p-6">
            <div className='bg-[#0D314B] rounded-lg'>
                {/* Header */}
                <div className="flex justify-between items-center p-6">
                    <h1 className="text-[20px] font-semibold text-[#F9FAFB]">Subscribers</h1>
                    <div className='relative'>
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-[#007ED6] rounded-lg focus:ring-2 focus:ring-[#007ED6] focus:border-[#007ED6]"
                        />
                        <Search size={18} className='absolute right-4 top-3 cursor-pointer' />
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
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Registration Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Subscriptions
                                    </th>
                                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Action
                                    </th> */}
                                </tr>
                            </thead>
                            <tbody className="">
                                {currentUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-white">
                                            {users.length === 0 ? "No subscribers found" : "No matching subscribers found"}
                                        </td>
                                    </tr>
                                ) : (
                                    currentUsers.map((user, index) => (
                                        <tr key={user.id} className="">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {startIndex + index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                                <div className='flex items-center gap-3'>
                                                    <Image
                                                        src={user?.image}
                                                        alt={user?.name}
                                                        width={120}
                                                        height={60}
                                                        className='w-10 h-10 object-fill rounded'
                                                    />
                                                    {user.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#F9FAFB]">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {user.registrationDate}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold text-[#F9FAFB] `}
                                                >
                                                    {user.subscription}
                                                </span>
                                            </td>
                                            {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => handleBlock(user.id)}
                                                        className="bg-[#0ABF9D4D] px-4 py-1 text-[#0ABF9D] rounded cursor-pointer font-medium transition-colors"
                                                    >
                                                        Block
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemove(user.id)}
                                                        className="bg-[#551214] px-4 py-1 text-[#FE4D4F] rounded cursor-pointer font-medium transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td> */}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-[#007ED6]">
                        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                            {/* Showing results text */}
                            <div className="text-sm text-white">
                                Showing{' '}
                                <span className="font-medium">
                                    {totalItems === 0 ? 0 : startIndex + 1}
                                </span>{' '}
                                to{' '}
                                <span className="font-medium">
                                    {Math.min(endIndex, totalItems)}
                                </span>{' '}
                                of{' '}
                                <span className="font-medium">{totalItems}</span> results
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 0 && (
                                <div className="flex items-center space-x-3">
                                    {/* Previous Button */}
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`w-10 h-10 font-bold text-sm rounded transition-colors cursor-pointer ${currentPage === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        <ChevronLeft size={24} color='black' className='font-bold mx-auto' />
                                    </button>

                                    {/* Page Numbers */}
                                    {getPageNumbers().map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`w-10 h-10 font-bold text-sm rounded transition-colors cursor-pointer ${currentPage === page
                                                ? 'bg-[#245FE7] text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    {/* Next Button */}
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className={`w-10 h-10 font-bold cursor-pointer text-sm rounded transition-colors ${currentPage === totalPages || totalPages === 0
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        <ChevronRight size={24} color='black' className='font-bold mx-auto' />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}