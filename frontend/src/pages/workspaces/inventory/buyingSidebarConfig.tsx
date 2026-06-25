import React from 'react';
import { ShoppingCart, ClipboardList, Receipt, PieChart, Layers, Users } from 'lucide-react';
import { WorkspaceLayoutConfig } from '../../../layouts/WorkspaceLayout';

export const BUYING_SIDEBAR: WorkspaceLayoutConfig = {
  workspaceKey: 'procurement',
  workspaceName: 'Procurement',
  accentColor: '#d4af37',
  icon: <ShoppingCart size={18} />,
  navItems: [
    { label: 'Buying Dashboard', subPath: '', icon: <Layers size={15} /> },
    { label: 'Suppliers', subPath: 'suppliers', icon: <Users size={15} /> },
    { label: 'Material Requests', subPath: 'material-requests', icon: <ClipboardList size={15} /> },
    { label: 'Purchase Orders', subPath: 'purchase-orders', icon: <ShoppingCart size={15} /> },
    { label: 'Purchase Invoices', subPath: 'purchase-invoices', icon: <Receipt size={15} /> },
    { label: 'Purchase Analytics', subPath: 'analytics', icon: <PieChart size={15} /> },
  ],
};
