import React from "react";
import {
  Users,
  Layers,
  TrendingUp,
  ShoppingBag,
  FileText,
  PhoneCall,
  FileCheck,
  ArrowUpRight,
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
    {
      groupName: "CRM",
      items: [
        { label: "Leads", subPath: "leads", icon: React.createElement(Users, { size: 14 }) },
        { label: "Customers", subPath: "customers", icon: React.createElement(Users, { size: 14 }) },
        { label: "Contacts", subPath: "contacts", icon: React.createElement(PhoneCall, { size: 14 }) },
        { label: "Deals", subPath: "deals", icon: React.createElement(ArrowUpRight, { size: 14 }) },
      ],
    },
    {
      groupName: "Sales",
      items: [
        { label: "Quotations", subPath: "quotations", icon: React.createElement(FileText, { size: 14 }) },
        { label: "Sales Orders", subPath: "sales-orders", icon: React.createElement(ShoppingBag, { size: 14 }) },
      ],
    },
    {
      groupName: "Activities",
      items: [
        { label: "Tasks", subPath: "tasks", icon: React.createElement(FileCheck, { size: 14 }) },
      ],
    },
  ],
};