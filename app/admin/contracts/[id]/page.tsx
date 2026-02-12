"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

interface ContractVersion {
  id: string;
  version_number: number;
  content: string;
  pdf_url: string;
  is_current: boolean;
  created_at: string;
}

interface Contract {
  id: string;
  client: {
    id: string;
    name: string;
    company: string;
    email: string;
  } | string | null;
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
}

export default function ContractDetailPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<ContractVersion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientDetails, setClientDetails] = useState<{
    id: string;
    name: string;
    company: string;
    email: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    content: "",
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const fetchContract = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getContract(contractId);
      setContract(data);
      setSelectedVersion(data.current_version);
      setEditForm({
        title: data?.title || "",
        description: data?.description || "",
        content: data?.current_version?.content || "",
      });
      if (data?.client) {
        if (typeof data.client === "string") {
          const client = await api.getClient(data.client);
          setClientDetails(client || null);
        } else {
          setClientDetails(data.client);
        }
      } else {
        setClientDetails(null);
      }
    } catch (error) {
      console.error("Failed to fetch contract:", error);
      setError("Failed to load contract details. Please try again.");
      setContract(null);
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    if (user && contractId) {
      fetchContract();
    }
  }, [user, contractId, fetchContract]);

  const handleSignContract = async () => {
    if (!confirm("Are you sure you want to sign this contract? This will make it immutable.")) return;
    try {
      await api.signContract(contractId);
      fetchContract();
    } catch (error) {
      console.error("Failed to sign contract:", error);
    }
  };

  const handleRevokeContract = async () => {
    const reason = prompt("Enter revocation reason:");
    if (!reason) return;
    try {
      await api.revokeContract(contractId, reason);
      fetchContract();
    } catch (error) {
      console.error("Failed to revoke contract:", error);
    }
  };

  const handleCreateVersion = async () => {
    try {
      await api.createContractVersion(contractId);
      fetchContract();
    } catch (error) {
      console.error("Failed to create version:", error);
    }
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await api.updateContract(contractId, {
        title: editForm.title,
        description: editForm.description,
        content: editForm.content,
      });
      setIsEditing(false);
      fetchContract();
    } catch (error) {
      console.error("Failed to update contract:", error);
      setError("Failed to update draft. Please try again.");
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">PayMe Admin</h1>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                  <Link
                    href="/admin/contracts"
                    className="text-sm text-red-600 hover:text-red-500 mt-2 inline-block"
                  >
                    ← Back to Contracts
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!contract) return null;

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
          <div className="mb-6">
            <Link
              href="/admin/contracts"
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              ← Back to Contracts
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur shadow-xl border border-white/30 rounded-2xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{contract.title || "Untitled Contract"}</h2>
                  <p className="text-gray-600 mt-1">{contract.description || 'No description available'}</p>
                  <div className="mt-2 flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      Client: {clientDetails ? `${clientDetails.name} (${clientDetails.company})` : "Unknown Client"}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        contract.is_signed
                          ? contract.is_revoked
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {contract.is_revoked ? "Revoked" : contract.is_signed ? "Signed" : "Draft"}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Created: {new Date(contract.created_at).toLocaleDateString()}
                    {contract.signed_at && ` | Signed: ${new Date(contract.signed_at).toLocaleDateString()}`}
                    {contract.is_revoked && contract.revoked_at && ` | Revoked: ${new Date(contract.revoked_at).toLocaleDateString()}`}
                  </div>
                  {contract.revocation_reason && (
                    <p className="mt-2 text-sm text-red-600">
                      Revocation Reason: {contract.revocation_reason}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {contract.current_version?.pdf_url && (
                    <a
                      href={`http://localhost:8000${contract.current_version.pdf_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      View PDF
                    </a>
                  )}
                  {!contract.is_signed && (
                    <>
                      <button
                        onClick={handleCreateVersion}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        New Version
                      </button>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Edit Draft
                      </button>
                      <button
                        onClick={handleSignContract}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Sign Contract
                      </button>
                    </>
                  )}
                  {contract.is_signed && !contract.is_revoked && (
                    <button
                      onClick={handleRevokeContract}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Revoke Contract
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              {isEditing && !contract.is_signed && (
                <div className="mb-6 bg-white/90 backdrop-blur rounded-2xl border border-white/40 p-6 shadow-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Draft</h3>
                  <form onSubmit={handleSaveDraft} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Content</label>
                      <textarea
                        value={editForm.content}
                        onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                        rows={10}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Save Draft
                      </button>
                    </div>
                  </form>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Versions</h3>
                  <div className="space-y-2">
                    {contract.versions && contract.versions.length > 0 ? (
                      contract.versions.map((version) => (
                        <button
                          key={version.id}
                          onClick={() => setSelectedVersion(version)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                            selectedVersion?.id === version.id
                              ? "bg-indigo-100 text-indigo-900 border border-indigo-300"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <div className="font-medium">Version {version.version_number}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(version.created_at).toLocaleDateString()}
                            {version.is_current && " (Current)"}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No versions available</div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contract Content</h3>
                  {selectedVersion ? (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="prose max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                          {selectedVersion.content}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
                      Select a version to view content
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}