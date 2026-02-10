class ApiClient {
  constructor(baseURL = "http://localhost:8000/api") {
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
      console.log("Unauthorized, redirect to login");
    }

    return response.json();
  }

  // Authentication
  async login(username, password) {
    return this.request("/auth/token/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  async refreshToken(refresh) {
    return this.request("/auth/token/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh }),
    });
  }

  // Users
  async getUsers() {
    return this.request("/users/");
  }

  async createUser(userData) {
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

  async createClient(clientData) {
    return this.request("/clients/", {
      method: "POST",
      body: JSON.stringify(clientData),
    });
  }

  async getClient(id) {
    return this.request(`/clients/${id}/`);
  }

  async updateClient(id, clientData) {
    return this.request(`/clients/${id}/`, {
      method: "PUT",
      body: JSON.stringify(clientData),
    });
  }

  async deleteClient(id) {
    return this.request(`/clients/${id}/`, {
      method: "DELETE",
    });
  }

  // Contracts
  async getContracts() {
    return this.request("/contracts/");
  }

  async createContract(contractData) {
    return this.request("/contracts/", {
      method: "POST",
      body: JSON.stringify(contractData),
    });
  }

  async getContract(id) {
    return this.request(`/contracts/${id}/`);
  }

  async updateContract(id, contractData) {
    return this.request(`/contracts/${id}/`, {
      method: "PUT",
      body: JSON.stringify(contractData),
    });
  }

  async deleteContract(id) {
    return this.request(`/contracts/${id}/`, {
      method: "DELETE",
    });
  }

  async signContract(id) {
    return this.request(`/contracts/${id}/sign/`, {
      method: "POST",
    });
  }

  async revokeContract(id, reason) {
    return this.request(`/contracts/${id}/revoke/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async createContractVersion(id) {
    return this.request(`/contracts/${id}/create_version/`, {
      method: "POST",
    });
  }

  // Payments
  async getMilestones() {
    return this.request("/payments/milestones/");
  }

  async createMilestone(milestoneData) {
    return this.request("/payments/milestones/", {
      method: "POST",
      body: JSON.stringify(milestoneData),
    });
  }

  async getMilestone(id) {
    return this.request(`/payments/milestones/${id}/`);
  }

  async updateMilestone(id, milestoneData) {
    return this.request(`/payments/milestones/${id}/`, {
      method: "PUT",
      body: JSON.stringify(milestoneData),
    });
  }

  async deleteMilestone(id) {
    return this.request(`/payments/milestones/${id}/`, {
      method: "DELETE",
    });
  }

  async createCheckoutSession(id) {
    return this.request(`/payments/milestones/${id}/create_checkout_session/`, {
      method: "POST",
    });
  }

  // Audit
  async getAuditLogs() {
    return this.request("/audit/");
  }

  // Public
  async getPublicClient(uuid, token) {
    return this.request(`/public/clients/${uuid}/${token}/`);
  }
}

export default new ApiClient();