import { index, route } from "@react-router/dev/routes";

export default [
  index("pages/Home.jsx"),
  route("blog", "pages/Blog.jsx"),
  route("about", "pages/About.jsx"),
  route("contact", "pages/Contact.jsx"),
  route("dashboard", "pages/Dashboard.jsx"),
  route("dashboard/orders", "pages/DashboardOrders.jsx"),
  route("dashboard/services", "pages/DashboardServices.jsx"),
  route("dashboard/tickets", "pages/DashboardTickets.jsx"),
  route("dashboard/tickets/:ticketId", "pages/DashboardTicketDetail.jsx"),
  route("dashboard/add-fund", "pages/AddFund.jsx"),
  route("dashboard/add-fund/gateways", "pages/Payment.jsx"),
  route("dashboard/add-fund/pay/:methodKey", "pages/PaymentDetails.jsx"),
  route("signup", "pages/SignUp.jsx"),
  // Admin Routes
  route("admin/dashboard", "admin/Dashboard.jsx"),
  route("admin/users", "admin/Users.jsx"),
  route("admin/services", "admin/Services.jsx"),
  route("admin/orders", "admin/Orders.jsx"),
  route("admin/payment-requests", "admin/PaymentRequests.jsx"),
  route("admin/tickets", "admin/Tickets.jsx"),
  route("admin/settings", "admin/Settings.jsx"),
  route("admin/payment-settings", "admin/PaymentSettingsAdmin.jsx"),
];
