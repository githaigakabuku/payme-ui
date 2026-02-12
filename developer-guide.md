# Frontend Developer Guide - Contract Management SaaS

## Overview

This is a **Django REST Framework backend** for contract management with Stripe payment integration. The backend provides APIs for managing clients, contracts, payments, and audit trails. This guide explains what a frontend developer needs to implement.

## Backend Architecture

### Core Apps & Data Models

```
backend/
├── users/           # Admin users (JWT auth)
├── clients/         # Client companies (customers)
├── contracts/       # Contracts with versioning & signing
├── payments/        # Stripe payment milestones
├── audit/           # Complete audit trail
└── utils/           # Throttling, exceptions, storage
```

### Key Relationships

```
Client (Company)
├── has many Contracts
│   ├── has many ContractVersions (immutable after signing)
│   └── has many PaymentMilestones (tied to specific versions)
└── has one AccessToken (for public contract viewing)

User (Admin)
├── can manage all Clients, Contracts, Payments
└── all actions are audited
```

## Authentication & Authorization

### JWT Authentication

- **Endpoint**: `POST /api/auth/token/`
- **Payload**: `{"username": "admin", "password": "admin123"}`
- **Response**: `{"access": "jwt_token", "refresh": "refresh_token"}`
- **Header**: `Authorization: Bearer {access_token}`

### Permission Levels

1. **Admin Users**: Full access to all endpoints (JWT required)
2. **Public Clients**: Limited read-only access via access tokens (no JWT)

## Core User Flows

### 1. Admin Dashboard Flow

#### Login Process

```javascript
// POST /api/auth/token/
const login = async (username, password) => {
  const response = await fetch("/api/auth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const { access, refresh } = await response.json();
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
};
```

#### Client Management

```javascript
// GET /api/clients/ - List all clients
// POST /api/clients/ - Create new client
// PUT /api/clients/{id}/ - Update client
// DELETE /api/clients/{id}/ - Delete client

const clientData = {
  name: "Acme Corp",
  email: "contact@acme.com",
  company: "Acme Corporation",
  contact_person: "John Doe",
  phone: "+1-555-0123",
  address: "123 Main St, City, State 12345",
  tax_id: "TAX123456",
};
```

#### Contract Creation & Management

```javascript
// POST /api/contracts/ - Create contract
const contractData = {
  client: "client-uuid",
  title: "Service Agreement",
  description: "Monthly service agreement",
  content: "Full contract text here...",
};

// POST /api/contracts/{id}/sign/ - Sign contract (makes immutable)
// POST /api/contracts/{id}/revoke/ - Revoke signed contract
// POST /api/contracts/{id}/create_version/ - Create new version (if unsigned)

// Note: after creating a contract or version the backend generates a PDF
// and sets the `pdf_url` for the `ContractVersion` (e.g. `/pdfs/{version.id}/`).
```

#### Payment Milestones

```javascript
// GET /api/payments/milestones/ - List all milestones
// POST /api/payments/milestones/ - Create milestone
const milestoneData = {
  contract_version: "version-uuid",
  title: "Initial Payment",
  description: "First payment milestone",
  amount: 5000.0,
  currency: "USD",
  due_date: "2024-03-01",
};

// POST /api/payments/milestones/{id}/create_checkout_session/
// Returns: { session_id, checkout_url }
```

### 2. Client Portal Flow (Public Access)

#### Contract Viewing (No Authentication Required)

```javascript
// GET /api/public/clients/{client_uuid}/{access_token}/
// Returns: { client: {...}, contract: {...} }

// Example URL: /api/public/clients/123e4567-e89b-12d3-a456-426614174000/Wp9RBsQMZ5pdxs0hfe5m3pDcHRzJPcWE1VL05ajaLpM/
```

## API Endpoints Reference

### Authentication

- `POST /api/auth/token/` - Login
- `POST /api/auth/token/refresh/` - Refresh token

### Users (Admin Only)

- `GET /api/users/` - List users
- `POST /api/users/` - Create user
- `GET /api/users/me/` - Current user profile
- `POST /api/users/{id}/set_admin_status/` - Grant/revoke admin access

### Clients (Admin Only)

- `GET /api/clients/` - List clients (with search/filter)
- `POST /api/clients/` - Create client (auto-generates access_token)
- `GET /api/clients/{id}/` - Get client details
- `PUT /api/clients/{id}/` - Update client
- `DELETE /api/clients/{id}/` - Delete client
- `POST /api/clients/{id}/regenerate_token/` - New access token

### Contracts (Admin Only)

- `GET /api/contracts/` - List contracts
- `POST /api/contracts/` - Create contract
- `GET /api/contracts/{id}/` - Get contract with versions
- `PUT /api/contracts/{id}/` - Update contract (if unsigned)
- `DELETE /api/contracts/{id}/` - Delete contract (if unsigned)
- `POST /api/contracts/{id}/sign/` - Sign contract
- `POST /api/contracts/{id}/revoke/` - Revoke contract
- `POST /api/contracts/{id}/create_version/` - New version
- `GET /api/contracts/{id}/versions/` - List versions

- **Contract Templates (Admin Only)**
  - `GET /api/contracts/templates/` - List templates
  - `POST /api/contracts/templates/` - Create template
  - `GET /api/contracts/templates/{id}/` - Get template
  - `PUT /api/contracts/templates/{id}/` - Update template
  - `DELETE /api/contracts/templates/{id}/` - Delete template

### Payments (Admin Only)

- `GET /api/payments/milestones/` - List milestones
- `POST /api/payments/milestones/` - Create milestone
- `GET /api/payments/milestones/{id}/` - Get milestone
- `PUT /api/payments/milestones/{id}/` - Update milestone
- `DELETE /api/payments/milestones/{id}/` - Delete milestone
- `POST /api/payments/milestones/{id}/create_checkout_session/` - Create Stripe checkout
- `POST /api/payments/milestones/{id}/refund/` - Refund payment
- `GET /api/payments/events/` - View webhook events (admin read-only)
- `GET /api/payments/tiers/` - List subscription tiers
- `POST /api/payments/tiers/` - Create subscription tier
- `GET /api/payments/tiers/{id}/` - Get subscription tier
- `GET /api/payments/invoices/` - List invoices
- `POST /api/payments/invoices/` - Create invoice
- `GET /api/payments/invoices/{id}/` - Get invoice

### Audit (Admin Only)

- `GET /api/audit/` - Complete audit trail (filterable by action, user, object)

### Public Endpoints (No Auth)

- `GET /api/public/clients/{uuid}/{token}/` - Client contract view
- `GET /api/public/clients/{uuid}/{token}/info/` - Client info only
- `GET /api/public/clients/{uuid}/{token}/info/` - Client info only
- `POST /api/payments/webhook/stripe/` - Stripe webhook handler

## Data Structures

### Client

```javascript
{
  id: "uuid",
  name: "Acme Corp",
  email: "contact@acme.com",
  company: "Acme Corporation",
  contact_person: "John Doe",
  phone: "+1-555-0123",
  address: "123 Main St...",
  tax_id: "TAX123456",
  access_token: "secret-token-for-public-access",
  is_active: true,
  metadata: {},
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
}
```

### Contract

```javascript
{
  id: "uuid",
  client: "client-uuid",
  title: "Service Agreement",
  description: "Monthly services",
  is_signed: false,
  is_revoked: false,
  signed_at: null,
  revoked_at: null,
  revocation_reason: "",
  versions: [/* ContractVersion objects */],
  current_version: {/* ContractVersion object */},
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
}
```

### ContractVersion

```javascript
{
  id: "uuid",
  version_number: 1,
  content: "Full contract text...",
  pdf_url: "/pdfs/uuid/",
  is_current: true,
  created_at: "2024-01-01T00:00:00Z"
}
```

### PaymentMilestone

```javascript
{
  id: "uuid",
  contract_version: "version-uuid",
  title: "Initial Payment",
  description: "First milestone",
  amount: 5000.00,
  currency: "USD",
  status: "pending|checkout_created|processing|completed|failed|refunded",
  due_date: "2024-03-01",
  stripe_session_id: "cs_...",
  paid_amount: 0.00,
  paid_at: null,
  payment_method: "card",
  metadata: {},
  created_at: "2024-01-01T00:00:00Z"
}
```

## Frontend Implementation Requirements

### Must-Have Features

#### 1. Admin Dashboard

- **User Management**: Create admin users, set permissions
- **Client Management**: CRUD operations with search/filter
- **Contract Builder**: Rich text editor for contract content
- **Version Control**: Show contract history, create new versions
- **Payment Tracking**: View milestones, create Stripe checkouts
- **Audit Log**: Searchable activity feed

#### 2. Client Portal

- **Contract Viewer**: Display signed contracts (PDF or HTML)
- **Payment Portal**: Stripe Checkout integration
- **Status Tracking**: Show payment status, due dates

#### 3. Integration Points

- **Stripe Checkout**: Handle payment flows, success/cancel redirects
- **PDF Generation & Download**: The backend now generates professional contract PDFs using WeasyPrint. After creating a contract or a new version the backend generates a PDF and exposes it at `/pdfs/{version.id}/` (the `ContractVersion.pdf_url` is set to `/pdfs/{version.id}/`). Frontend can link to that URL for downloads or in-browser viewing.
- **Email Notifications (sent async)**: The backend sends transactional emails via Celery (SendGrid configured). Emails are sent for events such as contract signing, invoice creation, and payment reminders. Email tasks use the `FRONTEND_URL` setting to build links back to the frontend (e.g. contract, payment, invoice pages).

### UI/UX Considerations

#### Admin Interface

- **Data Tables**: Sortable, filterable lists for clients, contracts, payments
- **Forms**: Contract creation with rich text, client details
- **Status Indicators**: Contract signed/unsigned, payment statuses
- **Search**: Global search across clients, contracts, payments

#### Client Portal

- **Clean, Professional**: Legal document presentation
- **Payment Flow**: Clear calls-to-action for payments
- **Status Updates**: Real-time payment status (webhooks)

### Technical Requirements

#### State Management

```javascript
// Suggested state structure
{
  auth: {
    user: null,
    token: null,
    refreshToken: null
  },
  clients: {
    list: [],
    current: null,
    loading: false
  },
  contracts: {
    list: [],
    current: null,
    versions: [],
    loading: false
  },
  payments: {
    milestones: [],
    current: null,
    loading: false
  },
  audit: {
    logs: [],
    filters: {}
  }
}
```

#### API Integration

```javascript
// Base API client
class ApiClient {
  constructor(baseURL = "/api") {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem("access_token");
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Handle token refresh or redirect to login
    }

    return response.json();
  }
}
```

## Subscription Tiers (Future Enhancement)

The backend is designed to support multiple subscription tiers:

### Tier Structure

```javascript
// Suggested tier model (add to backend)
{
  name: "Basic|Pro|Enterprise",
  max_clients: 10|100|unlimited,
  max_contracts_per_month: 50|500|unlimited,
  features: ["basic_contracts", "advanced_payments", "api_access"],
  stripe_price_id: "price_..."
}
```

### Frontend Implementation

- **Tier Selection**: During onboarding/client creation
- **Usage Tracking**: Show current usage vs limits
- **Upgrade Flows**: Stripe subscription management
- **Feature Gates**: Hide/show features based on tier

## Development Setup

### Environment Variables

```bash
# Backend .env (create this file)
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost:5432/db
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
# Frontend base URL used in transactional emails (e.g. https://app.example.com)
FRONTEND_URL=http://localhost:3000
# Celery configuration (broker/result backend)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
# Optional: SendGrid or SMTP API key used by email service
SENDGRID_API_KEY=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=no-reply@example.com
```

### Running the Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create test data
python manage.py create_test_data

# Start server
python manage.py runserver
```

### Testing APIs

```bash
# Login
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# List clients (use token from login)
curl http://localhost:8000/api/clients/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Next Steps for Frontend Development

1. **Choose Framework**: React/Next.js recommended for full-stack feel
2. **Implement Auth**: JWT handling with refresh logic
3. **Build Admin Dashboard**: Tables, forms, search
4. **Add Contract Editor**: Rich text editing for contract content
5. **Integrate Stripe**: Checkout sessions and webhooks
6. **Style Client Portal**: Professional contract viewing
7. **Add Real-time Updates**: WebSocket or polling for status changes
8. **Implement Testing**: Unit tests for components, integration tests for APIs

This backend provides a solid foundation - focus on building an intuitive UI that makes contract management feel effortless for both admins and clients.
