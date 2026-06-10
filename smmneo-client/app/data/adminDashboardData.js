// Mock data for admin dashboard
export const dashboardStats = [
  {
    id: 1,
    title: 'Total Members',
    count: '2,548',
    icon: '👥',
    color: 'bg-blue-100',
    trend: '+12.5%',
    trendUp: true,
  },
  {
    id: 2,
    title: 'Orders Received',
    count: '1,234',
    icon: '📦',
    color: 'bg-purple-100',
    trend: '+8.2%',
    trendUp: true,
  },
  {
    id: 3,
    title: 'Refill Orders',
    count: '456',
    icon: '🔄',
    color: 'bg-green-100',
    trend: '+4.3%',
    trendUp: true,
  },
  {
    id: 4,
    title: 'Reseller Orders',
    count: '789',
    icon: '🏪',
    color: 'bg-orange-100',
    trend: '+2.1%',
    trendUp: false,
  },
  {
    id: 5,
    title: 'Manual Orders',
    count: '234',
    icon: '✏️',
    color: 'bg-pink-100',
    trend: '+5.6%',
    trendUp: true,
  },
  {
    id: 6,
    title: 'Services',
    count: '42',
    icon: '🛠️',
    color: 'bg-cyan-100',
    trend: '+1.2%',
    trendUp: true,
  },
  {
    id: 7,
    title: 'Unread Tickets',
    count: '18',
    icon: '🎫',
    color: 'bg-red-100',
    trend: '-3.5%',
    trendUp: false,
  },
  {
    id: 8,
    title: 'Payments',
    count: '$45,230',
    icon: '💰',
    color: 'bg-yellow-100',
    trend: '+15.3%',
    trendUp: true,
  },
];

export const recentOrders = [
  {
    id: 'ORD-001',
    customer: 'John Doe',
    service: 'Instagram Likes',
    amount: '$125.50',
    status: 'completed',
    date: '2024-05-10',
  },
  {
    id: 'ORD-002',
    customer: 'Jane Smith',
    service: 'TikTok Followers',
    amount: '$89.99',
    status: 'pending',
    date: '2024-05-11',
  },
  {
    id: 'ORD-003',
    customer: 'Mike Johnson',
    service: 'YouTube Views',
    amount: '$234.00',
    status: 'processing',
    date: '2024-05-11',
  },
  {
    id: 'ORD-004',
    customer: 'Sarah Williams',
    service: 'Twitter Followers',
    amount: '$67.50',
    status: 'completed',
    date: '2024-05-12',
  },
  {
    id: 'ORD-005',
    customer: 'Alex Brown',
    service: 'Facebook Likes',
    amount: '$145.75',
    status: 'failed',
    date: '2024-05-12',
  },
];

export const sidebarMenuItems = [
  {
    id: 1,
    label: 'Dashboard',
    icon: '📊',
    path: '/admin/dashboard',
    category: 'main',
  },
  {
    id: 2,
    label: 'Users',
    icon: '👥',
    path: '/admin/users',
    category: 'main',
  },
  {
    id: 3,
    label: 'Services',
    icon: '🛠️',
    path: '/admin/services',
    category: 'main',
  },
  {
    id: 4,
    label: 'Orders',
    icon: '📦',
    path: '/admin/orders',
    category: 'main',
  },
  {
    id: 5,
    label: 'Payment Requests',
    icon: '💳',
    path: '/admin/payment-requests',
    category: 'main',
  },
  {
    id: 6,
    label: 'Tickets',
    icon: '🎫',
    path: '/admin/tickets',
    category: 'main',
  },
  {
    id: 6,
    label: 'Functions',
    icon: '⚙️',
    path: '/admin/functions',
    category: 'additional',
  },
  {
    id: 7,
    label: 'Additional',
    icon: '➕',
    path: '/admin/additional',
    category: 'additional',
  },
  {
    id: 8,
    label: 'Appearance',
    icon: '🎨',
    path: '/admin/appearance',
    category: 'additional',
  },
  {
    id: 9,
    label: 'Settings',
    icon: '⚙️',
    path: '/admin/settings',
    category: 'settings',
  },
];

export const usersData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', joinDate: '2024-01-15' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'active', joinDate: '2024-02-20' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', status: 'inactive', joinDate: '2024-03-10' },
];

export const ordersData = [
  { id: 1, orderId: 'ORD-001', customer: 'John Doe', service: 'Instagram Likes', status: 'completed', date: '2024-05-10' },
  { id: 2, orderId: 'ORD-002', customer: 'Jane Smith', service: 'TikTok Followers', status: 'pending', date: '2024-05-11' },
];

export const ticketsData = [
  { id: 1, ticketId: 'TKT-001', subject: 'Payment Issue', status: 'open', priority: 'high', date: '2024-05-12' },
  { id: 2, ticketId: 'TKT-002', subject: 'Service Not Delivered', status: 'closed', priority: 'medium', date: '2024-05-11' },
];
