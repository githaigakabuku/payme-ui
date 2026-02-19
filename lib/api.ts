class ApiClient {
  baseURL: string;

  constructor(baseURL = "http://localhost:8000/api") {
    this.baseURL = baseURL;
  }

  async request(endpoint: any, options: any = {}) {
    const token = localStorage.getItem("access_token");
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    console.log("API Request:", this.baseURL + endpoint, options.method || "GET", { token: !!token });
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });
    console.log("API Response status:", response.status, response.statusText);

    if (response.status === 401) {
      console.log("Unauthorized, clearing token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      // Don't try to parse JSON for 401, might be HTML
      throw new Error("Unauthorized");
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      console.log("Non-JSON response:", text);
      if (response.ok) {
        return { message: text };
      } else {
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
    }
  }

  // Authentication
  async login(username: any, password: any) {
    return this.request("/auth/token/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  async refreshToken(refresh: any) {
    return this.request("/auth/token/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh }),
    });
  }

  // Users
  async getUsers() {
    return this.request("/users/");
  }

  async createUser(userData: any) {
    return this.request("/users/", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request("/users/me/");
  }

  // Clients
  async getClients() {
    return this.request("/clients/");
  }

  async createClient(clientData: any) {
    return this.request("/clients/", {
      method: "POST",
      body: JSON.stringify(clientData),
    });
  }

  async getClient(id: any) {
    return this.request(`/clients/${id}/`);
  }

  async updateClient(id: any, clientData: any) {
    return this.request(`/clients/${id}/`, {
      method: "PUT",
      body: JSON.stringify(clientData),
    });
  }

  async deleteClient(id: any) {
    return this.request(`/clients/${id}/`, {
      method: "DELETE",
    });
  }

  // Contracts
  async getContracts() {
    return this.request("/contracts/");
  }

  async createContract(contractData: any) {
    return this.request("/contracts/", {
      method: "POST",
      body: JSON.stringify(contractData),
    });
  }

  async getContract(id: any) {
    return this.request(`/contracts/${id}/`);
  }

  async updateContract(id: any, contractData: any) {
    return this.request(`/contracts/${id}/`, {
      method: "PUT",
      body: JSON.stringify(contractData),
    });
  }

  async deleteContract(id: any) {
    return this.request(`/contracts/${id}/`, {
      method: "DELETE",
    });
  }

  async signContract(id: any) {
    return this.request(`/contracts/${id}/sign/`, {
      method: "POST",
    });
  }

  async revokeContract(id: any, reason: any) {
    return this.request(`/contracts/${id}/revoke/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async createContractVersion(id: any) {
    return this.request(`/contracts/${id}/create_version/`, {
      method: "POST",
    });
  }

  // Payments
  async getMilestones() {
    return this.request("/payments/milestones/");
  }

  async createMilestone(milestoneData: any) {
    return this.request("/payments/milestones/", {
      method: "POST",
      body: JSON.stringify(milestoneData),
    });
  }

  async getMilestone(id: any) {
    return this.request(`/payments/milestones/${id}/`);
  }

  async updateMilestone(id: any, milestoneData : any) {
    return this.request(`/payments/milestones/${id}/`, {
      method: "PUT",
      body: JSON.stringify(milestoneData),
    });
  }

  async deleteMilestone(id : any) {
    return this.request(`/payments/milestones/${id}/`, {
      method: "DELETE",
    });
  }

  async createCheckoutSession(id: any) {
    return this.request(`/payments/milestones/${id}/create_checkout_session/`, {
      method: "POST",
    });
  }

  // Subscription Tiers
  async getTiers() {
    return this.request("/payments/tiers/");
  }

  async createTier(tierData: any) {
    return this.request("/payments/tiers/", {
      method: "POST",
      body: JSON.stringify(tierData),
    });
  }

  async getTier(id: any) {
    return this.request(`/payments/tiers/${id}/`);
  }

  async updateTier(id: any, tierData: any) {
    return this.request(`/payments/tiers/${id}/`, {
      method: "PUT",
      body: JSON.stringify(tierData),
    });
  }

  async deleteTier(id: any) {
    return this.request(`/payments/tiers/${id}/`, {
      method: "DELETE",
    });
  }

  // Invoices
  async getInvoices() {
    return this.request("/payments/invoices/");
  }

  async createInvoice(invoiceData: any) {
    return this.request("/payments/invoices/", {
      method: "POST",
      body: JSON.stringify(invoiceData),
    });
  }

  async getInvoice(id: any) {
    return this.request(`/payments/invoices/${id}/`);
  }

  async updateInvoice(id: any, invoiceData: any) {
    return this.request(`/payments/invoices/${id}/`, {
      method: "PUT",
      body: JSON.stringify(invoiceData),
    });
  }

  async deleteInvoice(id: any) {
    return this.request(`/payments/invoices/${id}/`, {
      method: "DELETE",
    });
  }

  // Contract Templates
  async getTemplates() {
    return this.request("/contracts/templates/");
  }

  async createTemplate(templateData: any) {
    return this.request("/contracts/templates/", {
      method: "POST",
      body: JSON.stringify(templateData),
    });
  }

  async getTemplate(id: any) {
    return this.request(`/contracts/templates/${id}/`);
  }

  async updateTemplate(id: any, templateData: any) {
    return this.request(`/contracts/templates/${id}/`, {
      method: "PUT",
      body: JSON.stringify(templateData),
    });
  }

  async deleteTemplate(id: any) {
    return this.request(`/contracts/templates/${id}/`, {
      method: "DELETE",
    });
  }

  // Audit
  async getAuditLogs() {
    return this.request("/audit/");
  }

  // Public
  async getPublicClient(uuid: any, token: any) {
    return this.request(`/public/clients/${uuid}/${token}/`);
  }
}

export default new ApiClient();