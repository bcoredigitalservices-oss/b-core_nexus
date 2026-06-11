import React from 'react';
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
  Phone
} from 'lucide-react';
import { WorkspaceLayoutConfig } from '../../../layouts/WorkspaceLayout';

export const CRM_SIDEBAR: WorkspaceLayoutConfig = {
  workspaceKey: 'crm',
  workspaceName: 'CRM',
  accentColor: '#00f5a0',
  icon: <Users size={18} />,
  navItems: [
    { label: 'Dashboard',           subPath: '',             icon: <Layers size={15} /> },
    { label: 'Pipeline & Leads',    subPath: 'pipeline',     icon: <TrendingUp size={15} /> },
    { label: 'Deals',               subPath: 'deals',        icon: <ArrowUpRight size={15} /> },
    { label: 'Customer Accounts',   subPath: 'accounts',     icon: <Users size={15} /> },
    { label: 'Sales Orders',        subPath: 'sales-orders', icon: <ShoppingBag size={15} /> },
    { label: 'Quotations',          subPath: 'quotations',   icon: <FileText size={15} /> },
    { label: 'Contacts',            subPath: 'contacts',     icon: <PhoneCall size={15} /> },
    { label: 'Call Log',            subPath: 'call-log',     icon: <Phone size={15} /> },
    { label: 'Tasks & ToDo',        subPath: 'tasks',        icon: <FileCheck size={15} /> },
    { label: 'Interaction History', subPath: 'interactions', icon: <History size={15} /> },
  ],
};
