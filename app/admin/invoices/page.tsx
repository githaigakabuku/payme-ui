"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import SidebarLayout from "@/app/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Plus, Receipt, CreditCard, ExternalLink } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

interface Invoice {
  id: string;
  client: { id: string; name: string };
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
  title: string;
}

export default function AdminInvoices() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const form = useForm({
    defaultValues: {
      client: "",
      amount: 0,
      due_date: "",
      title: "",
    },
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchInvoices();
      fetchClients();
    }
  }, [user]);

  const fetchInvoices = async () => {
    try {
      const response = await api.getInvoices();
      const invoiceList = response?.results ?? response ?? [];
      setInvoices(Array.isArray(invoiceList) ? invoiceList : []);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      setInvoices([]);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.getClients();
      const clientList = response?.results ?? response ?? [];
      setClients(Array.isArray(clientList) ? clientList : []);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setError("");
      setSuccess("");
      console.log("📤 Submitting invoice data:", data);

      const response = await api.createInvoice(data);

      console.log("✅ Invoice created successfully:", response);
      setSuccess("Invoice created successfully!");
      setIsDialogOpen(false);
      form.reset();
      fetchInvoices();
    } catch (error: any) {
      console.error("❌ Failed to create invoice:", error);
      const errorMsg = error?.response?.data || error?.message || "Failed to create invoice";
      setError(`Error: ${JSON.stringify(errorMsg)}`);
    }
  };

  const handlePayWithStripe = async (invoiceId: string) => {
    try {
      setPayingInvoiceId(invoiceId);
      setError("");

      // Create checkout session on the backend
      const session = await api.createInvoiceCheckoutSession(invoiceId);
      console.log("Stripe checkout session:", session);

      if (session?.url) {
        // Redirect to Stripe Checkout
        window.location.href = session.url;
      } else if (session?.sessionId) {
        // If backend returns a session ID, use stripe-js to redirect
        const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
        if (stripe) {
          const { error } = await (stripe as any).redirectToCheckout({
            sessionId: session.sessionId,
          });
          if (error) {
            setError(`Payment error: ${error.message}`);
          }
        } else {
          setError("Failed to load Stripe. Please check your publishable key.");
        }
      } else {
        setError("No checkout URL returned from server");
      }
    } catch (error: any) {
      console.error("Failed to initiate payment:", error);
      const errorMsg = error?.response?.data || error?.message || "Failed to initiate payment";
      setError(`Error: ${JSON.stringify(errorMsg)}`);
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const getClientName = (client: any): string => {
    try {
      if (!client) return "Unknown";
      if (typeof client === "object" && client.name) return client.name;
      if (typeof client === "string") {
        const found = clients.find((c) => c.id === client);
        return found?.name || "Unknown";
      }
      return "Unknown";
    } catch {
      return "Unknown";
    }
  };

  const getStatusBadge = (status: string) => {
    const normalized = status?.toLowerCase() || "";
    if (normalized.includes("paid")) {
      return { label: "Paid", className: "bg-green-500/20 text-green-400" };
    }
    if (normalized.includes("pending")) {
      return { label: "Pending", className: "bg-yellow-500/20 text-yellow-400" };
    }
    if (normalized.includes("overdue") || normalized.includes("past")) {
      return { label: "Overdue", className: "bg-red-500/20 text-red-400" };
    }
    return { label: status || "Unknown", className: "bg-gray-500/20 text-gray-400" };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarLayout user={user} logout={logout}>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Invoices</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
              </DialogHeader>
              {error && (
                <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm border border-red-500/30">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-500/20 text-green-400 p-3 rounded-lg text-sm border border-green-500/30">
                  {success}
                </div>
              )}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="client"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
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
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Invoice Title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100.00"
                            value={field.value === 0 ? "" : field.value}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Create Invoice</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/20 text-red-400 p-3 rounded-lg text-sm border border-red-500/30">
            {error}
          </div>
        )}

        <div className="glass-card rounded-xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="w-8 h-8 opacity-50" />
                      <p>No invoices yet. Create one to get started!</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => {
                  const status = getStatusBadge(invoice.status);
                  const isPaid = status.label === "Paid";
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.title}</TableCell>
                      <TableCell>{getClientName(invoice.client)}</TableCell>
                      <TableCell>${Number(invoice.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${status.className}`}>
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid && STRIPE_PUBLISHABLE_KEY && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => handlePayWithStripe(invoice.id)}
                              disabled={payingInvoiceId === invoice.id}
                            >
                              {payingInvoiceId === invoice.id ? (
                                <div className="w-3.5 h-3.5 mr-1 animate-spin rounded-full border border-primary border-t-transparent" />
                              ) : (
                                <CreditCard className="w-3.5 h-3.5 mr-1" />
                              )}
                              Pay with Stripe
                            </Button>
                          )}
                          {!isPaid && !STRIPE_PUBLISHABLE_KEY && (
                            <span className="text-xs text-muted-foreground">
                              Configure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable payments
                            </span>
                          )}
                          {invoice.id && (
                            <a
                              href={`https://clientpayment.onrender.com/api/payments/invoices/${invoice.id}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-foreground">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </SidebarLayout>
  );
}
