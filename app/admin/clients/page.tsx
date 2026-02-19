"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import SidebarLayout from "@/app/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Plus, Users, Building2, Mail, Phone } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  contact_person: string;
  phone: string;
  address: string;
  tax_id: string;
  is_active: boolean;
  created_at: string;
}

export default function ClientsPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      company: "",
      contact_person: "",
      phone: "",
      address: "",
      tax_id: "",
    },
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      const response = await api.getClients();
      const clientList = response?.results ?? response ?? [];
      setClients(Array.isArray(clientList) ? clientList : []);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      await api.createClient(data);
      setIsDialogOpen(false);
      form.reset();
      fetchClients();
    } catch (error) {
      console.error("Failed to create client:", error);
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

  return (
    <SidebarLayout user={user} logout={logout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Clients</h2>
            <p className="text-muted-foreground mt-1">{clients.length} total clients</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-primary hover:bg-primary/90 glow-purple-sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border/50 text-foreground max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add New Client</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80">Name</FormLabel>
                          <FormControl>
                            <Input className="glass-input rounded-xl" placeholder="Client name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80">Email</FormLabel>
                          <FormControl>
                            <Input type="email" className="glass-input rounded-xl" placeholder="client@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80">Company</FormLabel>
                          <FormControl>
                            <Input className="glass-input rounded-xl" placeholder="Company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact_person"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80">Contact Person</FormLabel>
                          <FormControl>
                            <Input className="glass-input rounded-xl" placeholder="Contact person" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80">Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" className="glass-input rounded-xl" placeholder="+1 (555) 000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tax_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80">Tax ID</FormLabel>
                          <FormControl>
                            <Input className="glass-input rounded-xl" placeholder="Tax ID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80">Address</FormLabel>
                        <FormControl>
                          <Textarea className="glass-input rounded-xl" placeholder="Full address" rows={3} {...field} />
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
                      Create Client
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <p className="text-foreground font-medium">No clients yet</p>
              <p className="text-muted-foreground text-sm mt-1">Add your first client to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Client</TableHead>
                  <TableHead className="text-muted-foreground">Company</TableHead>
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground">Phone</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className="border-border/20 hover:bg-accent/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">
                            {client.name?.[0]?.toUpperCase() ?? "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          <p className="text-xs text-muted-foreground">{client.contact_person}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground/80">{client.company}</TableCell>
                    <TableCell className="text-foreground/80">{client.email}</TableCell>
                    <TableCell className="text-foreground/80">{client.phone || "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.is_active ? "badge-success" : "badge-destructive"
                      }`}>
                        {client.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}