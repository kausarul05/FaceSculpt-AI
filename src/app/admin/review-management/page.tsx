'use client'

import { Trash } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import userImage from "@/../public/images/profile.jpg"
import { apiRequest } from '@/app/lib/api';
import { toast } from 'react-toastify';

interface Review {
    id: number;
    body: string;
    created: string;
    rating: string;
    reviewer: number;
    reviewer_name: string;
}

interface ApiResponse<T> {
    data?: T;
    error?: string;
}

interface ReviewsResponse {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    results: Review[];
}


export default function ReviewManagement() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReviews, setTotalReviews] = useState(0);
    const pageSize = 5;

    // Fetch reviews
    const fetchReviews = async (page: number = 1) => {
        try {
            setLoading(true);
            const response = await apiRequest(
                "GET", 
                `/service/review/?page=${page}&page_size=${pageSize}`, 
                null,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`
                    }
                }
            );

            console.log("abc", response)

            if (response.results) {
                setReviews(response.results || []);
                setTotalPages(response.total_pages);
                setTotalReviews(response.total);
                setCurrentPage(response.page);
            } else if (response.error) {
                console.error("Error fetching reviews:", response.error);
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews(1);
    }, []);

    const handleDelete = async (reviewId: number) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;

        try {
            const response = await apiRequest(
                "DELETE", 
                `/service/review/${reviewId}/`, 
                null,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`
                    }
                }
            );

            if (response.data || !response.error) {
                // Refresh the current page or go to previous page if current page becomes empty
                if (reviews.length === 1 && currentPage > 1) {
                    toast.success("Review deleted successfully");
                    fetchReviews(currentPage - 1);
                } else {
                    toast.success("Review deleted successfully");
                    fetchReviews(currentPage);
                }
            } else if (response.error) {
                console.error("Failed to delete review:", response.error);
                toast.error("Failed to delete review: " + response.error);
            }
        } catch (error) {
            console.error("Error deleting review:", error);
            toast.error("Error deleting review");
        }
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            fetchReviews(page);
        }
    };

    // Convert star rating string to number for display
    const getStarCount = (rating: string): number => {
        return (rating.match(/⭐/g) || []).length;
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return pages;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A2131] p-6">
                <div className='bg-[#0D314B] p-6 rounded-lg'>
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white">Review Management</h1>
                    </div>
                    <div className="text-center py-12">
                        <div className="text-white">Loading reviews...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A2131] p-6">
            <div className='bg-[#0D314B] p-6 rounded-lg'>
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">Review Management</h1>
                    <p className="text-gray-400 mt-2">
                        Showing {reviews.length} of {totalReviews} reviews
                    </p>
                </div>

                {/* Reviews Grid - Simple layout like the image */}
                <div className="space-y-6">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="rounded-lg border border-[#007ED6] p-6"
                        >
                            {/* Review Header with Delete Button */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <Image
                                        src={userImage}
                                        alt='user photo'
                                        width={80}
                                        height={40}
                                        className='w-10 h-10 object-fill rounded-full'
                                    />
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{review.reviewer_name}</h3>
                                        <p className="text-gray-400 text-sm">{formatDate(review.created)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Review Comment - Simple text like in the image */}
                            <div className="text-white">
                                <p className="leading-relaxed text-sm font-semibold">{review.body}</p>
                            </div>

                            <div className='flex items-center justify-between gap-1 mt-5'>
                                <div className='flex gap-1'>
                                    {Array.from({ length: getStarCount(review.rating) }).map((_, i) => (
                                        <Image
                                            key={i}
                                            src='https://upload.wikimedia.org/wikipedia/commons/4/44/Plain_Yellow_Star.png'
                                            alt='star'
                                            width={80}
                                            height={40}
                                            className='w-4 h-4'
                                        />
                                    ))}
                                    <span className="text-yellow-400 text-sm ml-2">
                                        ({getStarCount(review.rating)} stars)
                                    </span>
                                </div>

                                <button 
                                    onClick={() => handleDelete(review.id)} 
                                    className="p-2 rounded-full border cursor-pointer border-[#EB4335] hover:bg-[#12446a]"
                                >
                                    <Trash size={16} className="text-[#EB4335]" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2 mt-8">
                        {/* Previous Button */}
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-[#007ED6] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#006bb3] transition-colors"
                        >
                            Previous
                        </button>

                        {/* Page Numbers */}
                        {getPageNumbers().map(page => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    currentPage === page
                                        ? 'bg-[#007ED6] text-white'
                                        : 'bg-[#0A2131] text-white hover:bg-[#12446a] border border-[#1b4b70]'
                                }`}
                            >
                                {page}
                            </button>
                        ))}

                        {/* Next Button */}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-[#007ED6] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#006bb3] transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Page Info */}
                <div className="text-center mt-4 text-gray-400">
                    Page {currentPage} of {totalPages}
                </div>

                {/* Empty State */}
                {reviews.length === 0 && (
                    <div className="text-center py-12">
                        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md mx-auto">
                            <svg
                                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
                            <p className="text-gray-500">There are no reviews to display at the moment.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}