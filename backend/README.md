# Smart Inventory & Asset Management System — Backend API

Node.js, Express.js, and MongoDB backend for institutional asset lifecycle management.

## Environment Variables (.env)
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart_inventory
JWT_SECRET=college_smart_inventory_jwt_secret_key_2026
```

## Setup & Running
1. `cd backend`
2. `npm install`
3. Seed sample data:
   `npm run seed`
4. Start backend server:
   `npm run dev`
Server will start on `http://localhost:5000` with full REST APIs under `/api/*`.

## Demo Credentials
- **Admin**: `admin@inventory.com` | `password123`
- **Staff**: `staff@inventory.com` | `password123`
- **Department Head**: `head@inventory.com` | `password123`
