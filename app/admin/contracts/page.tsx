"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

interface Contract {
  id: string;
  client: string | null;
  title: string;
  description: string;
  is_signed: boolean;
  is_revoked: boolean;
  signed_at: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
  current_version: {
    id: string;
    version_number: number;
    pdf_url: string;
  } | null;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
}

export default function ContractsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  const [formData, setFormData] = useState({
    client: "",
    title: "",
    description: "",
    content: "",
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchContracts();
      fetchClients();
    }
  }, [user]);

  const fetchContracts = async () => {
    try {
      setError(null);
      const data = await api.getContracts();
      // Ensure data is always an array (supports DRF pagination)
      const contractsArray = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : data
            ? [data]
            : [];
      setContracts(contractsArray);
    } catch (error) {
      console.error("Failed to fetch contracts:", error);
      setError("Failed to load contracts. Please try again.");
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await api.getClients();
      // Ensure data is always an array (supports DRF pagination)
      const clientsArray = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : data
            ? [data]
            : [];
      setClients(clientsArray);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      setClients([]);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createContract(formData);
      setShowForm(false);
      setFormData({ client: "", title: "", description: "", content: "" });
      fetchContracts();
    } catch (error) {
      console.error("Failed to create contract:", error);
    }
  };

  const handleSignContract = async (id: string) => {
    if (!confirm("Are you sure you want to sign this contract? This will make it immutable.")) return;
    try {
      await api.signContract(id);
      fetchContracts();
    } catch (error) {
      console.error("Failed to sign contract:", error);
    }
  };

  const handleRevokeContract = async (id: string) => {
    const reason = prompt("Enter revocation reason:");
    if (!reason) return;
    try {
      await api.revokeContract(id, reason);
      fetchContracts();
    } catch (error) {
      console.error("Failed to revoke contract:", error);
    }
  };

  const handleCreateVersion = async (id: string) => {
    try {
      await api.createContractVersion(id);
      fetchContracts();
    } catch (error) {
      console.error("Failed to create version:", error);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 via-blue-950 to-cyan-900">
      <nav className="bg-white/80 backdrop-blur border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">PayMe Admin</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/admin"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/clients"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Clients
                </Link>
                <Link
                  href="/admin/contracts"
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Contracts
                </Link>
                <Link
                  href="/admin/payments"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Payments
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => {
                  localStorage.removeItem("access_token");
                  localStorage.removeItem("refresh_token");
                  router.push("/login");
                }}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      onClick={() => setError(null)}
                      className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100"
                    >
                      <span className="sr-only">Dismiss</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Contracts</h2>
            <button
              onClick={() => setShowForm(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-lg"
            >
              Create Contract
            </button>
          </div>

          {showForm && (
            <div className="bg-white/80 backdrop-blur shadow-xl rounded-2xl border border-white/30 p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Contract</h3>
              <form onSubmit={handleCreateContract} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client</label>
                  <select
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select a client</option>
                    {Array.isArray(clients) && clients.map((client) => (
                      <option key={client?.id || Math.random()} value={client?.id || ''}>
                        {client?.name || 'Unknown'} - {client?.company || 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={10}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter contract content..."
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Create Contract
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur shadow-xl border border-white/30 overflow-hidden sm:rounded-2xl">
            <ul className="divide-y divide-gray-200">
              {Array.isArray(contracts) && contracts.map((contract) => (
                <li key={contract.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{contract?.title || 'Untitled Contract'}</h3>
                        <span
                          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            contract?.is_signed
                              ? contract?.is_revoked
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {contract?.is_revoked ? "Revoked" : contract?.is_signed ? "Signed" : "Draft"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{contract?.description || 'No description'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {contract?.created_at ? new Date(contract.created_at).toLocaleDateString() : 'Unknown'}
                        {contract?.signed_at && ` | Signed: ${new Date(contract.signed_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {contract?.current_version?.pdf_url && (
                        <a
                          href={`http://localhost:8000${contract.current_version.pdf_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          View PDF
                        </a>
                      )}
                      {!contract?.is_signed && (
                        <>
                          <button
                            onClick={() => handleCreateVersion(contract.id)}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
                          >
                            New Version
                          </button>
                          <button
                            onClick={() => handleSignContract(contract.id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Sign
                          </button>
                        </>
                      )}
                      {contract?.is_signed && !contract?.is_revoked && (
                        <button
                          onClick={() => handleRevokeContract(contract.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Revoke
                        </button>
                      )}
                      <Link
                        href={`/admin/contracts/${contract.id}`}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {(!Array.isArray(contracts) || contracts.length === 0) && (
              <div className="text-center py-12">
                <p className="text-gray-500">No contracts found. Create your first contract!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}