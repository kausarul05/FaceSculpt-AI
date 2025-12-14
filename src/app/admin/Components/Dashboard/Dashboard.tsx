'use client'

import { apiRequest } from '@/app/lib/api';
import { DollarSign, ScanQrCode, Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';

// Define types
interface StatItem {
    title: string;
    value: string;
    icon: React.ReactNode;
}

interface User {
    id: number;
    name: string;
    phone: string;
    registrationDate: string;
    current_plan: string;
    Fullname?: string;
    date_joined: string;
    is_active: boolean;
}

interface ChartData {
    month: string;
    revenue: number;
}

interface DashboardCards {
    total_users?: number;
    total_earnings?: number;
    total_scans?: number;
    totalUsers?: number;
    totalEarnings?: number;
    totalScans?: number;
}

interface DashboardGraphData {
    month?: string;
    date?: string;
    label?: string;
    revenue?: number;
    earnings?: number;
    value?: number;
}

interface DashboardStatsData {
    cards?: DashboardCards;
    graph_data?: DashboardGraphData[];
    data?: {
        cards?: DashboardCards;
        graph_data?: DashboardGraphData[];
    };
    [key: string]: unknown; // Allow other properties
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

// interface UsersApiResponse {
//     success: boolean;
//     data?: {
//         results?: User[];
//         users?: User[];
//         data?: User[];
//         total?: number;
//         count?: number;
//         total_pages?: number;
//         [key: string]: unknown; // Allow other properties
//     };
//     results?: User[];
//     users?: User[];
//     total?: number;
//     count?: number;
//     total_pages?: number;
//     [key: string]: unknown; // Allow other properties
// }

interface CustomTooltipProps extends TooltipProps<number, string> {
    active?: boolean;
    payload?: Array<{
        value: number;
        payload: ChartData;
    }>;
    label?: string;
}

// Define user data interface for API responses
interface ApiUser {
    id?: number;
    name?: string;
    username?: string;
    Fullname?: string;
    phone?: string;
    phone_number?: string;
    mobile?: string;
    created_at?: string;
    date_joined?: string;
    registration_date?: string;
    current_plan?: string;
    plan?: string;
    is_active?: boolean;
    [key: string]: unknown; // Allow other properties
}

// Type guard functions
function isDashboardCards(obj: unknown): obj is DashboardCards {
    if (typeof obj !== 'object' || obj === null) return false;
    const hasTotalUsers = 'total_users' in obj || 'totalUsers' in obj;
    const hasTotalEarnings = 'total_earnings' in obj || 'totalEarnings' in obj;
    const hasTotalScans = 'total_scans' in obj || 'totalScans' in obj;
    return hasTotalUsers || hasTotalEarnings || hasTotalScans;
}

function isDashboardGraphDataArray(obj: unknown): obj is DashboardGraphData[] {
    return Array.isArray(obj) && obj.every(item => 
        typeof item === 'object' && 
        item !== null &&
        ('month' in item || 'date' in item || 'label' in item)
    );
}

function hasCardsAndGraphData(obj: unknown): obj is { cards: DashboardCards; graph_data: DashboardGraphData[] } {
    if (typeof obj !== 'object' || obj === null) return false;
    const typedObj = obj as { cards?: unknown; graph_data?: unknown };
    return typedObj.cards !== undefined && typedObj.graph_data !== undefined;
}

function hasNestedData(obj: unknown): obj is { data: { cards?: DashboardCards; graph_data?: DashboardGraphData[] } } {
    if (typeof obj !== 'object' || obj === null) return false;
    const typedObj = obj as { data?: unknown };
    return typedObj.data !== undefined && typeof typedObj.data === 'object' && typedObj.data !== null;
}

// Helper function to extract users from various response structures
function extractUsersFromResponse(data: unknown): ApiUser[] {
    if (!data || typeof data !== 'object') return [];
    
    const dataObj = data as Record<string, unknown>;
    
    // Check for direct array
    if (Array.isArray(dataObj)) {
        return dataObj as ApiUser[];
    }
    
    // Check for success response with data property
    if ('success' in dataObj && dataObj.success && 'data' in dataObj && dataObj.data && typeof dataObj.data === 'object') {
        const innerData = dataObj.data as Record<string, unknown>;
        
        // Try different array properties
        if ('results' in innerData && Array.isArray(innerData.results)) {
            return innerData.results as ApiUser[];
        }
        if ('users' in innerData && Array.isArray(innerData.users)) {
            return innerData.users as ApiUser[];
        }
        if ('data' in innerData && Array.isArray(innerData.data)) {
            return innerData.data as ApiUser[];
        }
    }
    
    // Check for direct properties
    if ('results' in dataObj && Array.isArray(dataObj.results)) {
        return dataObj.results as ApiUser[];
    }
    if ('users' in dataObj && Array.isArray(dataObj.users)) {
        return dataObj.users as ApiUser[];
    }
    if ('data' in dataObj && Array.isArray(dataObj.data)) {
        return dataObj.data as ApiUser[];
    }
    
    return [];
}

// Helper function to extract pagination info
function extractPaginationInfo(data: unknown): { total: number; total_pages: number } {
    const defaultInfo = { total: 0, total_pages: 1 };
    
    if (!data || typeof data !== 'object') return defaultInfo;
    
    const dataObj = data as Record<string, unknown>;
    
    // Check for success response with data property
    if ('success' in dataObj && dataObj.success && 'data' in dataObj && dataObj.data && typeof dataObj.data === 'object') {
        const innerData = dataObj.data as Record<string, unknown>;
        return {
            total: typeof innerData.total === 'number' ? innerData.total : 
                   typeof innerData.count === 'number' ? innerData.count : 0,
            total_pages: typeof innerData.total_pages === 'number' ? innerData.total_pages : 1
        };
    }
    
    // Check for direct properties
    return {
        total: typeof dataObj.total === 'number' ? dataObj.total : 
               typeof dataObj.count === 'number' ? dataObj.count : 0,
        total_pages: typeof dataObj.total_pages === 'number' ? dataObj.total_pages : 1
    };
}

export default function Dashboard() {
    const [totalUsers, setTotalUsers] = useState<string>('0');
    const [totalEarnings, setTotalEarnings] = useState<string>('0.00');
    const [totalScans, setTotalScans] = useState<string>('0');
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [growthPercentage, setGrowthPercentage] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const stats: StatItem[] = [
        {
            title: 'Total Users',
            value: totalUsers,
            icon: <Users size={24} color='#0ABF9D' className='font-bold' />
        },
        {
            title: 'Total Scans',
            value: totalScans,
            icon: <ScanQrCode size={24} color='#0ABF9D' className='font-bold' />
        },
        {
            title: 'Total Earning',
            value: `$${totalEarnings}`,
            icon: <DollarSign size={24} color='#0ABF9D' className='font-bold' />
        },
    ];

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch dashboard stats with proper typing
            const statsResponse = await apiRequest<ApiResponse<DashboardStatsData>>(
                "GET",
                "/api/dashboard/stats/",
                null,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`
                    }
                }
            );

            console.log("Dashboard stats response:", statsResponse);

            if (statsResponse?.success && statsResponse.data) {
                // Handle different possible response structures
                let cardsData: DashboardCards | undefined;
                let graphData: DashboardGraphData[] | undefined;

                const responseData = statsResponse.data;

                // Check the actual structure using type guards
                if (hasCardsAndGraphData(responseData)) {
                    // Case 1: Data has cards and graph_data directly
                    cardsData = responseData.cards;
                    graphData = responseData.graph_data;
                } else if (hasNestedData(responseData)) {
                    // Case 2: Data has a nested data object
                    cardsData = responseData.data.cards;
                    graphData = responseData.data.graph_data;
                } else if (isDashboardCards(responseData)) {
                    // Case 3: The entire response is the cards data
                    cardsData = responseData;
                }

                // Set total users with fallback
                if (cardsData) {
                    const usersValue = cardsData.total_users || cardsData.totalUsers;
                    if (usersValue !== undefined) {
                        setTotalUsers(usersValue.toLocaleString());
                    } else {
                        setTotalUsers('0');
                    }

                    // Set total earnings with fallback
                    const earningsValue = cardsData.total_earnings || cardsData.totalEarnings;
                    if (earningsValue !== undefined) {
                        setTotalEarnings(earningsValue.toFixed(2));
                    } else {
                        setTotalEarnings('0.00');
                    }

                    // Set total scans with fallback
                    const scansValue = cardsData.total_scans || cardsData.totalScans;
                    if (scansValue !== undefined) {
                        setTotalScans(scansValue.toLocaleString());
                    } else {
                        setTotalScans('0');
                    }
                } else {
                    // No cards data found
                    setTotalUsers('0');
                    setTotalEarnings('0.00');
                    setTotalScans('0');
                }

                // Set chart data if available
                if (graphData && isDashboardGraphDataArray(graphData)) {
                    const formattedChartData: ChartData[] = graphData.map((item) => ({
                        month: item.month || item.date || item.label || 'N/A',
                        revenue: item.revenue || item.earnings || item.value || 0
                    }));
                    setChartData(formattedChartData);

                    // Calculate growth percentage if we have historical data
                    if (formattedChartData.length >= 2) {
                        const currentMonth = formattedChartData[formattedChartData.length - 1]?.revenue || 0;
                        const previousMonth = formattedChartData[formattedChartData.length - 2]?.revenue || 0;

                        if (previousMonth > 0) {
                            const growth = ((currentMonth - previousMonth) / previousMonth) * 100;
                            setGrowthPercentage(parseFloat(growth.toFixed(1)));
                        } else {
                            setGrowthPercentage(0);
                        }
                    } else {
                        setGrowthPercentage(0);
                    }
                } else {
                    // If no graph data, show empty chart
                    setChartData([]);
                    setGrowthPercentage(0);
                }
            } else {
                console.error("Invalid dashboard response or no data");
                // Set default values
                setTotalUsers('0');
                setTotalEarnings('0.00');
                setTotalScans('0');
                setChartData([]);
                setGrowthPercentage(0);
            }

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            // Set default values on error
            setTotalUsers('0');
            setTotalEarnings('0.00');
            setTotalScans('0');
            setChartData([]);
            setGrowthPercentage(0);
        } finally {
            setLoading(false);
        }
    };

    // Fetch users list
    const fetchUsers = async () => {
        try {
            setLoading(true);

            // Build query parameters
            const endpoint = `/api/dashboard/users/?page=1&page_size=5`;

            // Fetch users - use unknown type since API response can vary
            const data = await apiRequest<unknown>("GET", endpoint, null, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`
                }
            });

            console.log("Users response:", data);

            // Extract users from response using helper function
            const usersData = extractUsersFromResponse(data);
            
            // Extract pagination info
            const paginationInfo = extractPaginationInfo(data);

            if (Array.isArray(usersData)) {
                const formattedUsers: User[] = usersData.map((user: ApiUser, index: number) => ({
                    id: user.id || index + 1,
                    name: user.name || user.username || user.Fullname || 'Unknown User',
                    Fullname: user.Fullname || user.name || user.username || 'Unknown User',
                    phone: user.phone || user.phone_number || user.mobile || 'N/A',
                    registrationDate: user.created_at || user.date_joined || user.registration_date || 'N/A',
                    date_joined: user.date_joined || user.created_at || user.registration_date || 'N/A',
                    current_plan: user.current_plan || user.plan || 'Free',
                    is_active: user.is_active !== false
                }));
                
                setUsers(formattedUsers);
                setTotalItems(paginationInfo.total || formattedUsers.length);
                setTotalPages(paginationInfo.total_pages || 1);
            } else {
                console.error("Unexpected users response structure:", data);
                setUsers([]);
                setTotalItems(0);
                setTotalPages(0);
            }

        } catch (error) {
            console.error('Failed to fetch users:', error);
            setUsers([]);
            setTotalItems(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    const getDisplayName = (user: User) => {
        return user.Fullname || user.name || 'Unknown User';
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString; // Return original string if invalid date
            }
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    useEffect(() => {
        const loadData = async () => {
            await fetchDashboardData();
            await fetchUsers();
        };

        loadData();

        // Optional: Refresh data every 5 minutes
        const interval = setInterval(loadData, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    // Custom tooltip
    const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 shadow-lg rounded-lg border">
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-sm text-blue-600">
                        Revenue: <span className="font-medium">${payload[0].value?.toLocaleString()}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A2131] p-6 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#000000] p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-[#1A2028] rounded-xl shadow-sm p-6">
                        <div className='flex justify-between items-center p-6'>
                            <div>
                                <h3 className="text-sm font-semibold text-white mb-2">{stat.title}</h3>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                            </div>
                            <div className='bg-[#0ABF9D33] p-3 rounded-lg'>{stat.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div>
                {/* Earning Summary Section with Recharts */}
                <div className="bg-[#1A2028] rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-white">Earning Summary</h2>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-sm text-white">Revenue</span>
                            </div>
                            <div className={`px-3 py-1 rounded text-sm font-medium ${growthPercentage >= 0
                                ? 'bg-green-500/20 text-green-300 border border-green-500'
                                : 'bg-red-500/20 text-red-300 border border-red-500'
                                }`}>
                                {growthPercentage >= 0 ? '+' : ''}{growthPercentage}% Monthly
                            </div>
                        </div>
                    </div>

                    {/* Recharts Bar Chart */}
                    <div className="h-80">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#fff', fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#fff', fontSize: 12 }}
                                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar
                                        dataKey="revenue"
                                        fill="#3b82f6"
                                        radius={[4, 4, 0, 0]}
                                        name="Revenue"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-white">
                                <p>No revenue data available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* User Section */}
                <div className="bg-[#1A2028] rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-white">Users</h2>
                        <div className="text-sm text-white">
                            Total: {totalItems} users
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border border-[#60A5FB66]">
                                <thead className="border-b border-[#60A5FB66] bg-[#60A5FB29] rounded-2xl">
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length > 0 ? (
                                        users.map((user, index) => (
                                            <tr key={user.id} className="border-b border-[#60A5FB66] hover:bg-[#60A5FB10]">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                                    {getDisplayName(user)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#F9FAFB]">
                                                    {user.phone}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                    {formatDate(user.date_joined)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${user.current_plan?.toLowerCase().includes('free')
                                                        ? 'bg-gray-500/20 text-gray-300 border border-gray-500'
                                                        : user.current_plan?.toLowerCase().includes('monthly')
                                                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500'
                                                            : user.current_plan?.toLowerCase().includes('6 month') || user.current_plan?.toLowerCase().includes('yearly')
                                                                ? 'bg-green-500/20 text-green-300 border border-green-500'
                                                                : 'bg-purple-500/20 text-purple-300 border border-purple-500'
                                                        }`}>
                                                        {user.current_plan}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-white">
                                                No users found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination - Optional */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-6 space-x-2">
                            <button
                                className="px-3 py-1 text-sm text-white bg-[#60A5FB29] rounded disabled:opacity-50"
                                disabled={true} // You'll need to implement pagination logic
                            >
                                Previous
                            </button>
                            <span className="text-white text-sm">
                                Page 1 of {totalPages}
                            </span>
                            <button
                                className="px-3 py-1 text-sm text-white bg-[#60A5FB29] rounded disabled:opacity-50"
                                disabled={true} // You'll need to implement pagination logic
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}