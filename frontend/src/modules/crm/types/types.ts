export interface Lead {
  id: string;
  reference_number: string;
  title: string;
  lead_type: "person" | "company";
  company_name?: string | null;
  pipeline_stage: string;
  priority?: string | null;
  lead_source?: string | null;
  is_converted: boolean;
  is_active: boolean;
  owner_id?: string | null;
  created_at: string;
  updated_at: string;
  
  // Mapped Local Storage values for mockup screens
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface User {
  id: string;
  first_name: string;
  last_name?: string | null;
  email: string;
}

export interface Customer {
  id: string;
  reference_number: string;
  company_name: string;
  tax_id?: string | null;
  payment_terms?: string | null;
  credit_limit?: number | null;
  is_active: boolean;
  owner_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  reference_number?: string | null;
  deal_name: string;
  pipeline_stage: string;
  expected_revenue: number;
  close_date: string | null;
  customer_id?: string | null;
  lead_id?: string | null;
  owner_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuotationLineItem {
  id: string;
  quotation_id: string;
  product_id?: string | null;
  description: string;
  quantity: number;
  unit_of_measure?: string | null;
  unit_price: number;
  line_discount_type?: string | null;
  line_discount_value: number;
  line_discount_amount: number;
  line_total: number;
  sort_order: number;
}

export interface Quotation {
  id: string;
  reference_number?: string | null;
  quotation_number: string;
  version: number;
  parent_quotation_id?: string | null;
  customer_id: string;
  template_id?: string | null;
  status: string;
  validity_date?: string | null;
  payment_terms?: string | null;
  delivery_terms?: string | null;
  currency: string;
  subtotal: number;
  overall_discount_type?: string | null;
  overall_discount_value: number;
  overall_discount_amount: number;
  taxable_amount: number;
  vat_rate: number;
  vat_amount: number;
  grand_total: number;
  quotation_type?: string | null;
  internal_notes?: string | null;
  customer_notes?: string | null;
  lead_id?: string | null;
  deal_id?: string | null;
  owner_id?: string | null;
  created_at: string;
  updated_at: string;
  line_items?: QuotationLineItem[];
}

export interface SalesOrderLineItem {
  id: string;
  sales_order_id: string;
  product_id?: string | null;
  description: string;
  quantity: number;
  unit_of_measure?: string | null;
  unit_price: number;
  line_total: number;
}

export interface SalesOrder {
  id: string;
  reference_number?: string | null;
  order_number: string;
  quotation_id: string;
  customer_id: string;
  status: string;
  payment_terms?: string | null;
  delivery_terms?: string | null;
  currency: string;
  subtotal: number;
  overall_discount_amount: number;
  vat_amount: number;
  grand_total: number;
  internal_notes?: string | null;
  expected_delivery_date?: string | null;
  actual_delivery_date?: string | null;
  owner_id?: string | null;
  created_at: string;
  updated_at: string;
  line_items?: SalesOrderLineItem[];
}

export interface Product {
  id: string;
  sku: string;
  serial_number?: string | null;
  name: string;
  description?: string | null;
  category_id?: string | null;
  unit_of_measure: string;
  standard_price: number;
  min_order_qty: number;
  lead_time_days: number;
  stock_qty: number;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceListItem {
  id: string;
  price_list_id: string;
  product_id: string;
  price: number;
  product?: Product;
}

export interface PriceList {
  id: string;
  name: string;
  currency: string;
  is_default: boolean;
  items?: PriceListItem[];
}

