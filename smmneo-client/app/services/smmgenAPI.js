// API Service - Stub (All API functionality removed)
// This file is kept for backward compatibility
// All functionality has been moved to mock data in components

export async function getServices() {
  throw new Error('API calls removed. Use mock data in components instead.');
}

export async function syncServices() {
  throw new Error('API calls removed. Use mock data in components instead.');
}

export async function getServicesFromDB() {
  throw new Error('API calls removed. Use mock data in components instead.');
}

export async function getServicesByCategory(category) {
  throw new Error('API calls removed. Use mock data in components instead.');
}

export async function getServiceById(serviceId) {
  throw new Error('API calls removed. Use mock data in components instead.');
}

export async function getServiceCategories() {
  throw new Error('API calls removed. Use mock data in components instead.');
}

export async function getBalance() {
  throw new Error('API calls removed. Use mock data in components instead.');
}

export async function createOrder(orderData) {
  throw new Error('API calls removed. Use mock data in components instead.');
}

export async function getOrderStatus(orderId) {
  throw new Error('API calls removed. Use mock data in components instead.');
}

export async function getOrdersStatus(orderIds) {
  throw new Error('API calls removed. Use mock data in components instead.');
}

export async function refillOrder(orderId) {
  throw new Error('API calls removed. Use mock data in components instead.');
}

export async function multiRefill(orderIds) {
  throw new Error('API calls removed. Use mock data in components instead.');
}

export async function getRefillStatus(refillId) {
  throw new Error('API calls removed. Use mock data in components instead.');
}

export async function cancelOrders(orderIds) {
  throw new Error('API calls removed. Use mock data in components instead.');
}
export async function getMyOrders() {
  try {
    const response = await fetch(`${API_BASE_URL}/my-orders`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return await response.json();
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}
