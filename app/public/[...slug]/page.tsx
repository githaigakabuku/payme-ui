"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

interface ClientData {
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

export default function PublicContractView() {
  const params = useParams();
  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!params.slug || !Array.isArray(params.slug) || params.slug.length !== 2) {
        setError("Invalid URL");
        setLoading(false);
        return;
      }

      const [clientId, token] = params.slug;

      try {
        const response = await api.getPublicClient(clientId, token);
        setData(response);
      } catch (err) {
        setError("Failed to load contract. Please check your link.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600">{error || "Contract not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{data.contract.title}</h1>
                <p className="text-sm text-gray-600 mt-1">{data.contract.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{data.client.company}</p>
                <p className="text-sm text-gray-600">{data.client.name}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Contract Status</h2>
              <div className="flex items-center">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    data.contract.is_signed
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {data.contract.is_signed ? "Signed" : "Pending Signature"}
                </span>
                {data.contract.signed_at && (
                  <span className="ml-2 text-sm text-gray-600">
                    Signed on {new Date(data.contract.signed_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Contract Content</h2>
                {data.contract.current_version.pdf_url && (
                  <a
                    href={data.contract.current_version.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Download PDF
                  </a>
                )}
              </div>
              <div className="bg-gray-50 border rounded-lg p-6">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: data.contract.current_version.content }}
                />
              </div>
            </div>

            {!data.contract.is_signed && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Contract Not Yet Signed
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        This contract is still pending signature. Please contact your contract administrator for updates.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}