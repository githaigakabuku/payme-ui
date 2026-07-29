"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import SidebarLayout from "@/app/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Plus, File, Eye, Download, FileText } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  template_content: string;
  required_tier: string;
  required_tier_display?: string;
  category?: string;
  created_at: string;
}

export default function AdminTemplates() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [renderedContent, setRenderedContent] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      template_content: "",
      required_tier: "",
      category: "",
    },
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchTemplates();
      fetchTiers();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      const response = await api.getTemplates();
      const templateList = response?.results ?? response ?? [];
      setTemplates(Array.isArray(templateList) ? templateList : []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      setTemplates([]);
    }
  };

  const fetchTiers = async () => {
    try {
      const response = await api.getTiers();
      const tierList = response?.results ?? response ?? [];
      setTiers(Array.isArray(tierList) ? tierList : []);
    } catch (error) {
      console.error("Failed to fetch tiers:", error);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      await api.createTemplate({
        name: data.name,
        description: data.description,
        template_content: data.template_content,
        required_tier: data.required_tier,
        category: data.category || undefined,
      });
      setIsDialogOpen(false);
      form.reset();
      fetchTemplates();
    } catch (error) {
      console.error("Failed to create template:", error);
    }
  };

  // Extract placeholders like {{variable_name}} from template content
  const extractPlaceholders = (content: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const placeholders: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (!placeholders.includes(match[1])) {
        placeholders.push(match[1]);
      }
    }
    return placeholders;
  };

  // Render template with provided data
  const renderTemplate = (content: string, data: Record<string, string>): string => {
    return content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return data[key] || `{{${key}}}`;
    });
  };

  const openPreview = (template: Template) => {
    setPreviewTemplate(template);
    const placeholders = extractPlaceholders(template.template_content || "");
    const defaultData: Record<string, string> = {};
    placeholders.forEach((p) => {
      // Provide sensible defaults based on placeholder name
      if (p.includes("name") || p.includes("Name")) defaultData[p] = "John Doe";
      else if (p.includes("company") || p.includes("Company")) defaultData[p] = "Acme Corp";
      else if (p.includes("email") || p.includes("Email")) defaultData[p] = "john@acme.com";
      else if (p.includes("date") || p.includes("Date")) defaultData[p] = new Date().toLocaleDateString();
      else if (p.includes("amount") || p.includes("Amount") || p.includes("price")) defaultData[p] = "$1,000.00";
      else if (p.includes("address") || p.includes("Address")) defaultData[p] = "123 Main St, City";
      else defaultData[p] = `[${p}]`;
    });
    setPreviewData(defaultData);
    setRenderedContent(renderTemplate(template.template_content || "", defaultData));
    setIsPreviewOpen(true);
  };

  const updatePreviewData = (key: string, value: string) => {
    const newData = { ...previewData, [key]: value };
    setPreviewData(newData);
    if (previewTemplate) {
      setRenderedContent(renderTemplate(previewTemplate.template_content || "", newData));
    }
  };

  const handleDownloadPDF = async (template: Template) => {
    // Use the rendered content if available, otherwise render with defaults
    const content = template.template_content || "";
    const placeholders = extractPlaceholders(content);
    const data: Record<string, string> = {};
    placeholders.forEach((p) => {
      if (p.includes("name") || p.includes("Name")) data[p] = "John Doe";
      else if (p.includes("company") || p.includes("Company")) data[p] = "Acme Corp";
      else if (p.includes("email") || p.includes("Email")) data[p] = "john@acme.com";
      else if (p.includes("date") || p.includes("Date")) data[p] = new Date().toLocaleDateString();
      else if (p.includes("amount") || p.includes("Amount") || p.includes("price")) data[p] = "$1,000.00";
      else if (p.includes("address") || p.includes("Address")) data[p] = "123 Main St, City";
      else data[p] = `[${p}]`;
    });
    const rendered = renderTemplate(content, data);

    // Create a printable window
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to download PDF");
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${template.name} - Preview</title>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; padding: 40px; line-height: 1.6; color: #1a1a2e; max-width: 800px; margin: 0 auto; }
          h1 { color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h2 { color: #7c3aed; margin: 0; }
          .content { white-space: pre-wrap; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${template.name}</h2>
          ${template.description ? `<p style="color: #64748b;">${template.description}</p>` : ""}
        </div>
        <div class="content">${rendered.replace(/\n/g, "<br>")}</div>
        <div class="footer">
          <p>Generated by PayMe - Contract Management Platform</p>
          <p>${new Date().toLocaleDateString()}</p>
        </div>
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #7c3aed; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
            Print / Save as PDF
          </button>
        </div>
        <script>
          window.onload = function() { setTimeout(() => window.print(), 500); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
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
          <h2 className="text-2xl font-bold text-foreground">Contract Templates</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
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
                          <Input placeholder="Standard Contract Template" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="required_tier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tier (Required)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a tier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tiers.map((tier) => (
                              <SelectItem key={tier.id} value={tier.id}>
                                {tier.name}
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Brief description of the template" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Service Agreement, NDA, Consulting" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="template_content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={`Enter contract template content with placeholders like:\n\n{{client_name}}\n{{company_name}}\n{{contract_date}}\n{{service_fee}}`}
                            className="min-h-[300px] font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Use {"{{variable_name}}"} for placeholders. These will be replaced when generating contracts.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Create Template</Button>
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
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 opacity-50" />
                      <p>No templates yet. Create one to get started!</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{template.description}</TableCell>
                    <TableCell>{template.required_tier_display || "All"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openPreview(template)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleDownloadPDF(template)}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" /> PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
            </DialogHeader>
            {previewTemplate && (
              <div className="space-y-4">
                {/* Variable inputs */}
                {Object.keys(previewData).length > 0 && (
                  <div className="glass-light rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Template Variables</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.keys(previewData).map((key) => (
                        <div key={key}>
                          <label className="text-xs text-muted-foreground block mb-1">{key}</label>
                          <Input
                            className="glass-input rounded-xl text-sm"
                            value={previewData[key]}
                            onChange={(e) => updatePreviewData(key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rendered content */}
                <div className="glass-light rounded-xl p-6" ref={previewRef}>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                      {renderedContent}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl border-border/50"
                    onClick={() => handleDownloadPDF(previewTemplate)}
                  >
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  );
}