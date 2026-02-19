"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import SidebarLayout from "@/app/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, XCircle, Clock, FileDown, FilePlus, Pen, Save, X } from "lucide-react";

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
  client: { id: string; name: string; company: string; email: string; } | string | null;
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
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<ContractVersion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clientDetails, setClientDetails] = useState<{ id: string; name: string; company: string; email: string; } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", content: "" });

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
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
      }
    } catch (error) {
      console.error("Failed to fetch contract:", error);
      setError("Failed to load contract details.");
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    if (user && contractId) fetchContract();
  }, [user, contractId, fetchContract]);

  const handleSignContract = async () => {
    if (!confirm("Sign this contract? It will become immutable.")) return;
    try {
      await api.signContract(contractId);
      setSuccess("Contract signed successfully!");
      fetchContract();
    } catch (error) {
      setError("Failed to sign contract.");
    }
  };

  const handleRevokeContract = async () => {
    const reason = prompt("Enter revocation reason:");
    if (!reason) return;
    try {
      await api.revokeContract(contractId, reason);
      fetchContract();
    } catch (error) {
      setError("Failed to revoke contract.");
    }
  };

  const handleCreateVersion = async () => {
    try {
      await api.createContractVersion(contractId);
      fetchContract();
    } catch (error) {
      setError("Failed to create version.");
    }
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateContract(contractId, editForm);
      setIsEditing(false);
      fetchContract();
    } catch (error) {
      setError("Failed to save draft.");
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (error && !contract) {
    return (
      <SidebarLayout user={user} logout={logout}>
        <div className="space-y-4">
          <Link href="/admin/contracts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Contracts
          </Link>
          <div className="badge-destructive rounded-xl p-4">{error}</div>
        </div>
      </SidebarLayout>
    );
  }

  if (!contract) return null;

  const getStatus = () => {
    if (contract.is_revoked) return { label: "Revoked", className: "badge-destructive", icon: XCircle };
    if (contract.is_signed) return { label: "Signed", className: "badge-success", icon: CheckCircle };
    return { label: "Draft", className: "badge-warning", icon: Clock };
  };

  const status = getStatus();

  return (
    <SidebarLayout user={user} logout={logout}>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Link href="/admin/contracts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Contracts
        </Link>

        {/* Alerts */}
        {success && (
          <div className="badge-success rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm">{success}</span>
            <button onClick={() => setSuccess(null)} className="hover:opacity-80"><X className="w-4 h-4" /></button>
          </div>
        )}
        {error && (
          <div className="badge-destructive rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="hover:opacity-80"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Contract Header */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-foreground">{contract.title || "Untitled"}</h2>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                  <status.icon className="w-3 h-3" />
                  {status.label}
                </span>
              </div>
              <p className="text-muted-foreground">{contract.description || "No description"}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Client: {clientDetails ? `${clientDetails.name} (${clientDetails.company})` : "Unknown"}</span>
                <span>Created: {new Date(contract.created_at).toLocaleDateString()}</span>
                {contract.signed_at && <span>Signed: {new Date(contract.signed_at).toLocaleDateString()}</span>}
              </div>
              {contract.revocation_reason && (
                <p className="text-sm text-destructive">Reason: {contract.revocation_reason}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {contract.current_version?.pdf_url && (
                <a href={`http://localhost:8000${contract.current_version.pdf_url}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-xl border-border/50">
                    <FileDown className="w-4 h-4 mr-2" /> PDF
                  </Button>
                </a>
              )}
              {!contract.is_signed && (
                <>
                  <Button variant="outline" className="rounded-xl border-border/50" onClick={handleCreateVersion}>
                    <FilePlus className="w-4 h-4 mr-2" /> New Version
                  </Button>
                  <Button variant="outline" className="rounded-xl border-border/50" onClick={() => setIsEditing(!isEditing)}>
                    <Pen className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button className="rounded-xl bg-success/90 hover:bg-success text-success-foreground" onClick={handleSignContract}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Sign
                  </Button>
                </>
              )}
              {contract.is_signed && !contract.is_revoked && (
                <Button variant="destructive" className="rounded-xl" onClick={handleRevokeContract}>
                  <XCircle className="w-4 h-4 mr-2" /> Revoke
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && !contract.is_signed && (
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Edit Draft</h3>
            <form onSubmit={handleSaveDraft} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Title</label>
                <Input className="glass-input rounded-xl" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Description</label>
                <Input className="glass-input rounded-xl" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Content</label>
                <Textarea className="glass-input rounded-xl" rows={10} value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} required />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" className="rounded-xl border-border/50" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit" className="rounded-xl bg-primary hover:bg-primary/90">
                  <Save className="w-4 h-4 mr-2" /> Save Draft
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Content & Versions */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Versions sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Versions</h3>
              <div className="space-y-1.5">
                {contract.versions?.length > 0 ? (
                  contract.versions.map((version) => (
                    <button
                      key={version.id}
                      onClick={() => setSelectedVersion(version)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedVersion?.id === version.id
                          ? "bg-primary/20 text-primary glow-purple-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <div className="font-medium">Version {version.version_number}</div>
                      <div className="text-xs opacity-70">
                        {new Date(version.created_at).toLocaleDateString()}
                        {version.is_current && " (Current)"}
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No versions</p>
                )}
              </div>
            </div>
          </div>

          {/* Content viewer */}
          <div className="lg:col-span-3">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Contract Content</h3>
              {selectedVersion ? (
                <div className="glass-light rounded-xl p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                    {selectedVersion.content}
                  </pre>
                </div>
              ) : (
                <div className="glass-light rounded-xl p-6 text-center text-muted-foreground">
                  Select a version to view content
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
