import React from "react";
import {
  Users,
  Layers,
  TrendingUp,
  ShoppingBag,
  FileText,
  PhoneCall,
  FileCheck,
  History,
  ArrowUpRight,
  Phone,
} from "lucide-react";
// ── Type Safety Definition updated to target users directory structure ──
import { WorkspaceLayoutConfig } from "../users/components/WorkspaceLayout";

export const CRM_SIDEBAR: WorkspaceLayoutConfig = {
  workspaceKey: "crm",
  workspaceName: "CRM",
  accentColor: "#059669",
  icon: React.createElement(Users, { size: 18 }),
  navItems: [
    { label: "Dashboard", subPath: "", icon: React.createElement(Layers, { size: 15 }) },
    { label: "Pipeline & Leads", subPath: "pipeline", icon: React.createElement(TrendingUp, { size: 15 }) },
    { label: "Deals", subPath: "deals", icon: React.createElement(ArrowUpRight, { size: 15 }) },
    { label: "Customers", subPath: "customers", icon: React.createElement(Users, { size: 15 }) },
    { label: "Sales Orders", subPath: "sales-orders", icon: React.createElement(ShoppingBag, { size: 15 }) },
    { label: "Quotations", subPath: "quotations", icon: React.createElement(FileText, { size: 15 }) },
    { label: "Contacts", subPath: "contacts", icon: React.createElement(PhoneCall, { size: 15 }) },
    { label: "Call Log", subPath: "call-log", icon: React.createElement(Phone, { size: 15 }) },
    { label: "Tasks & ToDo", subPath: "tasks", icon: React.createElement(FileCheck, { size: 15 }) },
    { label: "Interaction History", subPath: "interactions", icon: React.createElement(History, { size: 15 }) },
  ],
};