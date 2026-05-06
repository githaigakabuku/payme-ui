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
import { useForm } from "react-hook-form";
import { Plus, CreditCard } from "lucide-react";

interface Tier {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  max_clients: number;
  max_contracts: number;
  max_templates: number;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export default function AdminTiers() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [featureInput, setFeatureInput] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const form = useForm({
    defaultValues: {
      name: "",
      display_name: "",
      price_monthly: "",
      price_yearly: "",
      max_clients: "",
      max_contracts: "",
      max_templates: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchTiers();
    }
  }, [user]);

  const fetchTiers = async () => {
    try {
      const response = await api.getTiers();
      const tierList = response?.results ?? response ?? [];
      setTiers(Array.isArray(tierList) ? tierList : []);
    } catch (error) {
      console.error("Failed to fetch tiers:", error);
      setTiers([]);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setError("");
      setSuccess("");

      // Validation
      if (!features || features.length === 0) {
        setError("Please add at least one feature");
        return;
      }

      // Format name: convert to lowercase, replace spaces with underscores
      const formattedName = data.name.toLowerCase().replace(/\s+/g, "_");

      // Build payload according to backend spec
      const payload = {
        name: formattedName,
        display_name: data.display_name,
        price_monthly: parseFloat(data.price_monthly),
        price_yearly: parseFloat(data.price_yearly),
        max_clients: parseInt(data.max_clients),
        max_contracts: parseInt(data.max_contracts),
        max_templates: parseInt(data.max_templates),
        features: features,
        is_active: data.is_active,
      };

      console.log("📤 Submitting tier payload:", JSON.stringify(payload, null, 2));

      const response = await api.createTier(payload);

      console.log("✅ Tier created successfully:", response);

      setSuccess("Tier created successfully!");
      setIsDialogOpen(false);
      form.reset();
      setFeatures([]);
      setFeatureInput("");
      fetchTiers();
    } catch (error: any) {
      console.error("❌ Failed to create tier:", error);
      const errorMsg = error?.response?.data || error?.message || "Failed to create tier";
      setError(`Error: ${JSON.stringify(errorMsg)}`);
    }
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
          <h2 className="text-2xl font-bold text-foreground">Subscription Tiers</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Tier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Tier</DialogTitle>
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
                  {/* Section 1: Basic Information */}
                  <div className="space-y-3 border-b pb-4">
                    <h3 className="font-semibold text-sm text-foreground">Basic Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name * (lowercase, no spaces)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="basic" 
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.toLowerCase().replace(/\s+/g, "_");
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Examples: basic, pro, enterprise, professional
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="display_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name * (shown to users)</FormLabel>
                          <FormControl>
                            <Input placeholder="Basic Plan" {...field} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Example: "Basic Plan", "Professional", "Enterprise Suite"
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Section 2: Pricing */}
                  <div className="space-y-3 border-b pb-4">
                    <h3 className="font-semibold text-sm text-foreground">Pricing</h3>
                    
                    <FormField
                      control={form.control}
                      name="price_monthly"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Price ($) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="29.99" 
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Must be greater than 0. Example: 29.99
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price_yearly"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yearly Price ($) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="299.99" 
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Usually 20% discount: monthly × 12 × 0.80. Example: 299.99
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Section 3: Limits */}
                  <div className="space-y-3 border-b pb-4">
                    <h3 className="font-semibold text-sm text-foreground">Usage Limits</h3>
                    
                    <FormField
                      control={form.control}
                      name="max_clients"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Clients *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="5" 
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Enter number (1, 5, 10, etc.) or -1 for unlimited
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="max_contracts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Contracts *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="20" 
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Enter number (20, 50, 100, etc.) or -1 for unlimited
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="max_templates"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Templates *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="10" 
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Enter number (5, 10, 25, etc.) or -1 for unlimited
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Section 4: Features */}
                  <div className="space-y-3 border-b pb-4">
                    <h3 className="font-semibold text-sm text-foreground">Features *</h3>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a feature"
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (featureInput.trim()) {
                              setFeatures([...features, featureInput.trim()]);
                              setFeatureInput("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (featureInput.trim()) {
                            setFeatures([...features, featureInput.trim()]);
                            setFeatureInput("");
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>

                    {features.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {features.length} feature{features.length !== 1 ? "s" : ""} added
                        </p>
                        <div className="space-y-2">
                          {features.map((feature, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                              <span className="text-sm">{feature}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {features.length === 0 && (
                      <p className="text-xs text-red-400">At least one feature is required</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1">
                      Create Tier
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        form.reset();
                        setFeatures([]);
                        setFeatureInput("");
                        setError("");
                        setSuccess("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="glass-card rounded-xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Monthly</TableHead>
                <TableHead>Yearly</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No tiers yet. Create one to get started!
                  </TableCell>
                </TableRow>
              ) : (
                tiers.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell className="font-medium">{tier.name}</TableCell>
                    <TableCell>{tier.display_name}</TableCell>
                    <TableCell>${Number(tier.price_monthly).toFixed(2)}</TableCell>
                    <TableCell>${Number(tier.price_yearly).toFixed(2)}</TableCell>
                    <TableCell className="text-sm">
                      <div className="space-y-0.5">
                        <div>C: {tier.max_clients === -1 ? "unlimited" : tier.max_clients}</div>
                        <div>Ct: {tier.max_contracts === -1 ? "unlimited" : tier.max_contracts}</div>
                        <div>T: {tier.max_templates === -1 ? "unlimited" : tier.max_templates}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{tier.features?.length || 0} features</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${tier.is_active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                        {tier.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </SidebarLayout>
  );
}