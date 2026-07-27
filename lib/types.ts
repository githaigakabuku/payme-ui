// PayMe UI - Shared TypeScript Interfaces

export interface User {
  id: string;
  username: string;
  email: string;
  is_admin_user: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  contact_person: string;
  phone: string;
  address: string;
  tax_id: string;
  access_token: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ContractVersion {
  id: string;
  version_number: number;
  content: string;
  pdf_url: string;
  is_current: boolean;
  created_at: string;
}

export interface Contract {
  id: string;
  client: string | { id: string; name: string; company: string; email: string };
  title: string;
  description: string;
  is_signed: boolean;
  is_revoked: boolean;
  signed_at: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
  versions: ContractVersion[];
  current_version: ContractVersion | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_clients: number;
  max_contracts: number;
  max_templates: number;
  features: string[];
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  template_content: string;
  category: string;
  required_tier: { id: string; name: string } | string;
  is_active: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  client: { id: string; name: string };
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  due_date: string;
  paid_at: string | null;
  payment_method: string | null;
  invoice_number: string;
  created_at: string;
}

export interface PaymentMilestone {
  id: string;
  contract_version: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: "pending" | "checkout_created" | "processing" | "completed" | "failed" | "refunded";
  due_date: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  paid_amount: number;
  paid_at: string | null;
  payment_method: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface StripeEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  processed: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  object_type: string;
  object_id: string;
  changes: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface PublicClientData {
  client: {
    id: string;
    name: string;
    company: string;
    email: string;
  };
  contract: {
    id: string;
    title: string;
    description: string;
    is_signed: boolean;
    signed_at: string | null;
    current_version: {
      content: string;
      pdf_url: string;
    };
  };
}

// API response wrapper (DRF paginated responses use { count, next, previous, results })
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Auth
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface CreateClientData {
  name: string;
  email: string;
  company: string;
  contact_person: string;
  phone?: string;
  address?: string;
  tax_id?: string;
}

export interface CreateContractData {
  client: string;
  title: string;
  description?: string;
  content: string;
  template?: string;
}

export interface CreateInvoiceData {
  client: string;
  title: string;
  amount: number;
  currency?: string;
  due_date: string;
  description?: string;
}

export interface CreateTierData {
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  max_clients: number;
  max_contracts: number;
  max_templates: number;
  features: string[];
  is_active?: boolean;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  template_content: string;
  required_tier: string;
  category?: string;
}

export interface CreateMilestoneData {
  contract_version: string;
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  due_date: string;
}