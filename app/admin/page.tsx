"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import SidebarLayout from "@/app/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Users, FileText, Receipt, File, CreditCard, ArrowRight, Activity, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    clients: 0,
    contracts: 0,
    payments: 0,
    audit: 0,
    tiers: 0,
    invoices: 0,
    templates: 0,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [clientsRes, contractsRes, paymentsRes, auditRes, tiersRes, invoicesRes, templatesRes] = await Promise.all([
        api.getClients(),
        api.getContracts(),
        api.getMilestones(),
        api.getAuditLogs(),
        api.getTiers(),
        api.getInvoices(),
        api.getTemplates(),
      ]);

      setStats({
        clients: Array.isArray(clientsRes?.results ?? clientsRes ?? []) ? (clientsRes?.results ?? clientsRes ?? []).length : 0,
        contracts: Array.isArray(contractsRes?.results ?? contractsRes ?? []) ? (contractsRes?.results ?? contractsRes ?? []).length : 0,
        payments: Array.isArray(paymentsRes?.results ?? paymentsRes ?? []) ? (paymentsRes?.results ?? paymentsRes ?? []).length : 0,
        audit: Array.isArray(auditRes?.results ?? auditRes ?? []) ? (auditRes?.results ?? auditRes ?? []).length : 0,
        tiers: Array.isArray(tiersRes?.results ?? tiersRes ?? []) ? (tiersRes?.results ?? tiersRes ?? []).length : 0,
        invoices: Array.isArray(invoicesRes?.results ?? invoicesRes ?? []) ? (invoicesRes?.results ?? invoicesRes ?? []).length : 0,
        templates: Array.isArray(templatesRes?.results ?? templatesRes ?? []) ? (templatesRes?.results ?? templatesRes ?? []).length : 0,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const statCards = [
    { label: "Clients", value: stats.clients, icon: Users, href: "/admin/clients", color: "text-purple-400" },
    { label: "Contracts", value: stats.contracts, icon: FileText, href: "/admin/contracts", color: "text-violet-400" },
    { label: "Invoices", value: stats.invoices, icon: Receipt, href: "/admin/invoices", color: "text-fuchsia-400" },
    { label: "Templates", value: stats.templates, icon: File, href: "/admin/templates", color: "text-indigo-400" },
  ];

  return (
    <SidebarLayout user={user} logout={logout}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Welcome back, {user.username}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <div className="glass-card rounded-xl p-5 hover:glow-purple-sm transition-all duration-300 group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Button asChild className="w-full justify-between bg-primary hover:bg-primary/90 rounded-xl h-11">
                <Link href="/admin/clients">
                  Add New Client
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" className="w-full justify-between rounded-xl h-11">
                <Link href="/admin/contracts">
                  Create Contract
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between rounded-xl h-11 border-border/50 hover:bg-accent">
                <Link href="/admin/invoices">
                  Create Invoice
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between rounded-xl h-11 border-border/50 hover:bg-accent">
                <Link href="/admin/tiers">
                  Manage Tiers
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Activity */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 glass-light rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground">{stats.tiers} subscription tiers active</p>
                  <p className="text-xs text-muted-foreground">Manage pricing plans</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 glass-light rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground">{stats.invoices} invoices tracked</p>
                  <p className="text-xs text-muted-foreground">Payment management</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 glass-light rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground">{stats.audit} audit log entries</p>
                  <p className="text-xs text-muted-foreground">System activity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}