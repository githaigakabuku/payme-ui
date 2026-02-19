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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Plus, CreditCard } from "lucide-react";

interface Tier {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export default function AdminTiers() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      price_monthly: 0,
      price_yearly: 0,
      features: "",
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
      await api.createTier({
        ...data,
        features: data.features.split(",").map((f: string) => f.trim()),
      });
      setIsDialogOpen(false);
      form.reset();
      fetchTiers();
    } catch (error) {
      console.error("Failed to create tier:", error);
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Tier</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Basic Plan" {...field} />
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Description of the tier" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price_monthly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Price</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="29.99" {...field} onChange={(e :any) => field.onChange(parseFloat(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price_yearly"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yearly Price</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="299.99" {...field} onChange={(e : any) => field.onChange(parseFloat(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="features"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Features (comma-separated)</FormLabel>
                        <FormControl>
                          <Input placeholder="Feature 1, Feature 2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Create Tier</Button>
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
                <TableHead>Description</TableHead>
                <TableHead>Monthly Price</TableHead>
                <TableHead>Yearly Price</TableHead>
                <TableHead>Features</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="font-medium">{tier.name}</TableCell>
                  <TableCell>{tier.description}</TableCell>
                  <TableCell>${tier.price_monthly}</TableCell>
                  <TableCell>${tier.price_yearly}</TableCell>
                  <TableCell>{tier.features.join(", ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </SidebarLayout>
  );
}