"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, FileDown, AlertTriangle, Sparkles } from "lucide-react";

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
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center max-w-md mx-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Error</h1>
          <p className="text-muted-foreground">{error || "Contract not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh">
      {/* Floating orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Brand header */}
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold text-primary tracking-wider uppercase">PayMe</span>
        </div>

        {/* Contract card */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-foreground">{data.contract.title}</h1>
                <p className="text-sm text-muted-foreground">{data.contract.description}</p>
              </div>
              <div className="text-right space-y-0.5 shrink-0">
                <p className="text-sm font-medium text-foreground/80">{data.client.company}</p>
                <p className="text-sm text-muted-foreground">{data.client.name}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* Status */}
            <div>
              <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider mb-3">Status</h2>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    data.contract.is_signed ? "badge-success" : "badge-warning"
                  }`}
                >
                  {data.contract.is_signed ? (
                    <><CheckCircle className="w-3 h-3" /> Signed</>
                  ) : (
                    <><Clock className="w-3 h-3" /> Pending Signature</>
                  )}
                </span>
                {data.contract.signed_at && (
                  <span className="text-sm text-muted-foreground">
                    Signed on {new Date(data.contract.signed_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">Contract Content</h2>
                {data.contract.current_version.pdf_url && (
                  <a href={data.contract.current_version.pdf_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="rounded-xl border-border/50">
                      <FileDown className="w-4 h-4 mr-2" /> Download PDF
                    </Button>
                  </a>
                )}
              </div>
              <div className="glass-light rounded-xl p-6">
                <div
                  className="prose prose-sm prose-invert max-w-none [&_*]:text-foreground/90"
                  dangerouslySetInnerHTML={{ __html: data.contract.current_version.content }}
                />
              </div>
            </div>

            {/* Pending notice */}
            {!data.contract.is_signed && (
              <div className="badge-warning rounded-xl px-4 py-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium">Contract Not Yet Signed</h3>
                    <p className="text-sm opacity-80 mt-1">
                      This contract is still pending signature. Please contact your contract administrator for updates.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">Powered by PayMe • Secure Contract Management</p>
        </div>
      </div>
    </div>
  );
}