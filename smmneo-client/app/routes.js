import { index, route } from "@react-router/dev/routes";

export default [
  index("pages/Home.jsx"),
  route("blog", "pages/Blog.jsx"),
  route("about", "pages/About.jsx"),
  route("contact", "pages/Contact.jsx"),
  route("dashboard", "pages/Dashboard.jsx"),
  route("dashboard/add-fund", "pages/AddFund.jsx"),
  route("signup", "pages/SignUp.jsx"),
  // Admin Routes
  route("admin/dashboard", "admin/Dashboard.jsx"),
  route("admin/users", "admin/Users.jsx"),
  route("admin/services", "admin/Services.jsx"),
  route("admin/orders", "admin/Orders.jsx"),
  route("admin/tickets", "admin/Tickets.jsx"),
  route("admin/settings", "admin/Settings.jsx"),
];
