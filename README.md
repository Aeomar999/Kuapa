# Kuapa — Ghana's Premier Agricultural Marketplace & Supply Chain Platform

<div align="center">
  <h3>Empowering Ghanaian Smallholder Farmers, Aggregators, Institutional Buyers & Transporters</h3>
</div>

---

## 🌾 Overview

**Kuapa** is an end-to-end mobile and web AgriTech platform designed to modernize agricultural trade across Ghana. By bridging the digital divide between rural producers and urban/commercial markets, Kuapa eliminates opaque middleman pricing, introduces standardized agricultural units of measurement, provides secure escrow payments via Mobile Money, and streamlines farm-to-table logistics.

Whether trading produce by the **Olonka**, **50kg Bag**, **Max Bag (100kg)**, or **Metric Ton**, Kuapa delivers price transparency, contract security, and real-time trade coordination.

---

## ✨ Key Features

- **🌱 Standardized Agricultural Units**: Built-in support and conversion for Ghanaian agricultural trading units including `Kilo`, `Bag (50kg)`, `Max Bag (100kg)`, `Olonka`, `Crate`, `Bunch`, and `Tuber`.
- **🤝 Real-Time Bulk Negotiations**: Multi-round B2B price and quantity negotiation engine allowing institutional buyers and aggregators to negotiate contracts directly with farmers over WebSockets.
- **💳 Mobile Money & Card Payments**: Seamless integration with **Paystack** for instant payments across MTN Mobile Money, Telecel Cash, AT Money, and debit/credit cards.
- **🚚 Dedicated Logistics & Transporter Workflows**: Integrated transport coordination connecting farmers, buyers, and verified transporters for farm-gate pickup and end-to-end tracking.
- **🔐 Enterprise-Grade Security & Authentication**: Robust Role-Based Access Control (RBAC) powered by **Better Auth** supporting Farmers, Aggregators, Institutional Buyers, Transporters, and Admins.
- **💬 Real-Time Support & Trade Chat**: Live WebSocket messaging between buyers, sellers, and support teams.

---

## 🛠 Tech Stack

### Frontend (Mobile Application)
- **Framework**: React Native with Expo SDK
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand & TanStack React Query
- **Navigation**: Expo Router

### Backend (API Server)
- **Framework**: NestJS (TypeScript)
- **ORM & Database**: Prisma ORM with PostgreSQL
- **Authentication**: Better Auth (`@better-auth/infra`)
- **Real-Time Communication**: Socket.IO WebSockets
- **Payments**: Paystack API (Card & Mobile Money)
- **Media Storage**: Cloudinary

---

## 📁 Monorepo Structure

```text
Kuapa/
├── apps/
│   ├── server/       # NestJS API backend, Prisma ORM, Better Auth & WebSockets
│   └── mobile/       # React Native (Expo) iOS/Android application
├── packages/
│   └── shared/       # Shared TypeScript types, constants & schemas
└── docs/             # Technical documentation, PRDs & setup manuals
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.x or v20.x
- **Package Manager**: `npm`
- **Database**: PostgreSQL 15+ (Local instance or cloud provider such as Neon/Supabase)
- **Mobile Development**: Expo Go app on physical iOS/Android device or Xcode/Android Studio simulator

---

### 1. Backend Setup (`apps/server`)

#### Step 1.1: Configure Environment Variables
Create a `.env` file inside `apps/server/` with your local or cloud credentials:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/kuapa"

# Better Auth Configuration
BETTER_AUTH_SECRET="your-32-character-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_API_KEY="ba_test_api_key"

# Server Port
PORT=3000

# Paystack Configuration
PAYSTACK_SECRET_KEY="sk_test_..."
PAYSTACK_PUBLIC_KEY="pk_test_..."

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

#### Step 1.2: Install Dependencies & Run Database Migrations
```bash
cd apps/server

# Install NestJS & Prisma dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Apply migrations to PostgreSQL
npm run prisma:migrate
```

#### Step 1.3: Seed Demo Data (Farmers, Aggregators, Products & Banners)
Kuapa includes a dedicated seeding script that populates realistic Ghanaian agricultural produce, standardized units, banners, and fully configured demo users:

```bash
# Seed agricultural demo products, system accounts, and banners
npm run seed:agri
```

#### Step 1.4: Start the API Server
```bash
# Start NestJS in development mode with watch/hot-reload
npm run start:dev
```
The backend API server will listen on `http://localhost:3000`.

---

### 2. Interactive API Documentation (Swagger UI)

Once the backend server is running (`npm run start:dev`), access the auto-generated Swagger OpenAPI documentation to inspect and test all endpoints:

👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

---

### 3. Mobile App Setup (`apps/mobile`)

#### Step 3.1: Configure Environment Variables
Create a `.env` file inside `apps/mobile/`:

```env
# IMPORTANT: Use your computer's local Wi-Fi IPv4 address (e.g., 192.168.1.15)
# Do NOT use localhost or 127.0.0.1 when testing on physical mobile devices.
EXPO_PUBLIC_API_URL="http://<YOUR_LOCAL_IP>:3000/api"

# Paystack Public Key
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_..."
```

#### Step 3.2: Install & Launch Expo
```bash
cd apps/mobile

# Install mobile dependencies
npm install

# Start the Expo development server
npm run start
```

Scan the QR code displayed in your terminal using the **Expo Go** application on your physical device, or press `i` / `a` to run on iOS Simulator or Android Emulator.

---

## 🧪 Demo User Accounts

After running `npm run seed:agri` in `apps/server`, you can log in with any of the pre-seeded demo accounts to test role-specific workflows:

| Role | Name | Demo Email | Password | Phone | Primary Capabilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Farmer / Vendor** | Kofi Mensah | `kofi.farmer@kuapa.com` | `Kuapa1234!` | `+233240000001` | List farm produce, set unit prices, manage harvest orders |
| **Institutional Buyer** | Ama Serwaa | `ama.buyer@kuapa.com` | `Kuapa1234!` | `+233240000002` | Wholesale purchasing, contract requests, mobile money escrow |
| **Transporter / Dispatcher** | Yaw Boateng | `yaw.transporter@kuapa.com` | `Kuapa1234!` | `+233240000003` | Accept logistics requests, track deliveries, farm-gate pickups |

---

## 🔧 Local Payment Webhook Testing (Paystack)

To test Paystack mobile money and card transaction verification locally:

1. Install and start [ngrok](https://ngrok.com/):
   ```bash
   ngrok http 3000
   ```
2. Copy your HTTPS forwarding URL (`https://<id>.ngrok-free.app`).
3. In your **Paystack Dashboard** under **Settings → API Keys & Webhooks**, set your **Test Webhook URL** to:
   ```text
   https://<id>.ngrok-free.app/api/webhooks/paystack
   ```

---

## 📚 Documentation

Additional documentation and architecture audits can be found in the root directory and `/docs`:
- `API-AUDIT.md`: Complete audit of all REST & WebSocket API endpoints.
- `ROLE-RELATIONS-AUDIT.md`: Role-Based Access Control matrix and permissions.
- `production_checklist.md`: Production readiness and deployment checklist.
- `support-chat-prd.md`: Product Requirements Document for Real-Time Trade & Support Chat.

---

## 📄 License

Copyright © 2026 Kuapa. All rights reserved.