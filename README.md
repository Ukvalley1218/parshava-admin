# Paarshva Infotech - Admin Panel

A professional admin dashboard for managing Paarshva Infotech's sales, customers, inquiries, orders, and products.

## Tech Stack

- **React 18** - UI Framework
- **Vite 5** - Build Tool
- **Tailwind CSS 3** - Styling
- **React Router 6** - Routing
- **Axios** - HTTP Client
- **Lucide React** - Icons

## Features

### Dashboard
- Overview statistics (Total Inquiries, Orders, Customers, Sales Users)
- Revenue tracking
- Recent inquiries and orders
- Quick actions for common tasks

### Sales Users Management
- Create, update, delete sales users
- Toggle user active/inactive status
- Role management (admin/user)

### Customers Management
- Full CRUD operations
- Search and filter customers
- View customer details

### Inquiries Management
- View all inquiries
- Filter by status
- Convert inquiries to orders
- Update inquiry status
- View detailed inquiry information

### Orders Management
- View all orders
- Update order status
- Track order progress
- View order details

### Products Management
- Sync products from AccountGST
- Add, edit, delete products
- Filter by brand and category

### Reports
- Sales overview charts
- Revenue breakdown tables
- Date range filtering
- Export data to CSV

### Settings
- Profile management
- Password change
- Notification preferences

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running on `https://parshava-backend.onrender.com`

### Installation

1. Install dependencies:
```bash
cd admin-panel
npm install
```

2. Create `.env` file:
```env
VITE_API_BASE_URL=https://parshava-backend.onrender.com/api
```

3. Start development server:
```bash
npm run dev
```

The admin panel will be available at `http://localhost:5174`

### Create Admin User

Run this command in the backend directory to create an initial admin user:

```bash
cd ../paarshva-backend
npm run seed:admin
```

Default credentials:
- Email: `admin@paarshva.com`
- Password: `admin123`

**⚠️ Change the default password after first login!**

## Project Structure

```
admin-panel/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Navbar.jsx      # Top navigation bar
│   │   ├── Sidebar.jsx     # Left sidebar navigation
│   │   └── ProtectedRoute.jsx
│   ├── context/           # React Context providers
│   │   └── AdminAuthContext.jsx
│   ├── layouts/           # Page layouts
│   │   └── AdminLayout.jsx
│   ├── pages/             # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── SalesUsers.jsx
│   │   ├── Customers.jsx
│   │   ├── Inquiries.jsx
│   │   ├── Orders.jsx
│   │   ├── Products.jsx
│   │   ├── Reports.jsx
│   │   └── Settings.jsx
│   ├── services/          # API services
│   │   ├── apiClient.js   # Axios configuration
│   │   └── adminApi.js    # Admin API endpoints
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── .env
```

## API Endpoints

### Authentication
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/auth/me` - Get admin profile
- `PUT /api/admin/auth/profile` - Update profile
- `PUT /api/admin/auth/change-password` - Change password

### Users
- `GET /api/admin/users` - List users
- `GET /api/admin/users/:id` - Get user
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `PATCH /api/admin/users/:id/toggle-status` - Toggle active status

### Customers
- `GET /api/admin/customers` - List customers
- `GET /api/admin/customers/:id` - Get customer
- `POST /api/admin/customers` - Create customer
- `PUT /api/admin/customers/:id` - Update customer
- `DELETE /api/admin/customers/:id` - Delete customer

### Inquiries
- `GET /api/admin/inquiries` - List inquiries
- `GET /api/admin/inquiries/:id` - Get inquiry
- `PATCH /api/admin/inquiries/:id/status` - Update status
- `DELETE /api/admin/inquiries/:id` - Delete inquiry
- `POST /api/admin/inquiries/:id/convert` - Convert to order

### Orders
- `GET /api/admin/orders` - List orders
- `GET /api/admin/orders/:id` - Get order
- `PATCH /api/admin/orders/:id/status` - Update status
- `DELETE /api/admin/orders/:id` - Delete order

### Products
- `GET /api/admin/products` - List products
- `GET /api/admin/products/:id` - Get product
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product

### Dashboard
- `GET /api/admin/dashboard/stats` - Get statistics
- `GET /api/admin/dashboard/recent-inquiries` - Get recent inquiries
- `GET /api/admin/dashboard/recent-orders` - Get recent orders

## Design System

### Colors
- Primary: `#1F3A5F` (Dark Blue)
- Sidebar: `#1F3A5F`
- Active: `#3b82f6` (Blue-500)
- Success: `#22c55e` (Green-500)
- Warning: `#f59e0b` (Amber-500)
- Danger: `#ef4444` (Red-500)

### Typography
- Font: `Plus Jakarta Sans`
- Headings: `Sora` (display font)

### Components
- Cards: `rounded-2xl`, soft shadows
- Buttons: `rounded-xl`, smooth transitions
- Inputs: `rounded-xl`, focus rings
- Tables: Clean header, hover states

## License

ISC