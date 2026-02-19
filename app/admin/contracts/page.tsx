"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import SidebarLayout from "@/app/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Plus, FileText, CheckCircle, XCircle, Clock, Eye, Pen, FilePlus } from "lucide-react";

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

interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
}

export default function ContractsPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      client: "",
      title: "",
      description: "",
      content: "",
      template: "",
    },
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
      fetchTemplates();
    }
  }, [user]);

  const fetchContracts = async () => {
    try {
      const data = await api.getContracts();
      const arr = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      setContracts(arr);
    } catch (error) {
      console.error("Failed to fetch contracts:", error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await api.getClients();
      const arr = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      setClients(arr);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await api.getTemplates();
      const arr = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      setTemplates(arr);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      await api.createContract(data);
      setIsDialogOpen(false);
      form.reset();
      fetchContracts();
    } catch (error) {
      console.error("Failed to create contract:", error);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    form.setValue("template", templateId);
    const selected = templates.find((t) => t.id === templateId);
    if (selected) {
      form.setValue("title", selected.name);
      form.setValue("description", selected.description);
      form.setValue("content", selected.content);
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

  const getStatusBadge = (contract: Contract) => {
    if (contract.is_revoked) return { label: "Revoked", className: "badge-destructive", icon: XCircle };
    if (contract.is_signed) return { label: "Signed", className: "badge-success", icon: CheckCircle };
    return { label: "Draft", className: "badge-warning", icon: Clock };
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarLayout user={user} logout={logout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Contracts</h2>
            <p className="text-muted-foreground mt-1">{contracts.length} total contracts</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-primary hover:bg-primary/90 glow-purple-sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border/50 text-foreground max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create New Contract</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="client"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80">Client</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="glass-input rounded-xl">
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="glass border-border/50">
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name} — {client.company}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="template"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80">Template (Optional)</FormLabel>
                        <Select onValueChange={handleTemplateChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="glass-input rounded-xl">
                              <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="glass border-border/50">
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80">Title</FormLabel>
                        <FormControl>
                          <Input className="glass-input rounded-xl" placeholder="Contract title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80">Description</FormLabel>
                        <FormControl>
                          <Input className="glass-input rounded-xl" placeholder="Brief description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80">Content</FormLabel>
                        <FormControl>
                          <Textarea className="glass-input rounded-xl" placeholder="Contract content..." rows={8} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" className="rounded-xl border-border/50" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="rounded-xl bg-primary hover:bg-primary/90">
                      Create Contract
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          {contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <p className="text-foreground font-medium">No contracts yet</p>
              <p className="text-muted-foreground text-sm mt-1">Create your first contract to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Contract</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Created</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => {
                  const status = getStatusBadge(contract);
                  return (
                    <TableRow key={contract.id} className="border-border/20 hover:bg-accent/50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{contract.title || "Untitled"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{contract.description || "No description"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground/60 text-sm">
                        {new Date(contract.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          {contract.current_version?.pdf_url && (
                            <a
                              href={`http://localhost:8000${contract.current_version.pdf_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-foreground">
                                <Eye className="w-3.5 h-3.5 mr-1" /> PDF
                              </Button>
                            </a>
                          )}
                          {!contract.is_signed && (
                            <>
                              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-foreground" onClick={() => handleCreateVersion(contract.id)}>
                                <FilePlus className="w-3.5 h-3.5 mr-1" /> Version
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 text-success hover:text-success" onClick={() => handleSignContract(contract.id)}>
                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Sign
                              </Button>
                            </>
                          )}
                          {contract.is_signed && !contract.is_revoked && (
                            <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive" onClick={() => handleRevokeContract(contract.id)}>
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Revoke
                            </Button>
                          )}
                          <Link href={`/admin/contracts/${contract.id}`}>
                            <Button variant="outline" size="sm" className="h-8 rounded-lg border-border/50">
                              Details
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
