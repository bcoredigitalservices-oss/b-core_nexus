import { Quotation, QuotationLineItem, SalesOrder } from "../types/types";

export const getSalesApi = (authFetch: (path: string, options?: Record<string, any>) => Promise<any>) => ({
  listQuotations: (): Promise<Quotation[]> => 
    authFetch("/sales/quotations").then((res) => (Array.isArray(res) ? res : [])),

  createQuotation: (payload: Record<string, any>): Promise<Quotation> =>
    authFetch("/sales/quotations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateQuotation: (id: string, payload: Record<string, any>): Promise<Quotation> =>
    authFetch(`/sales/quotations/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  addLineItem: (id: string, item: Record<string, any>): Promise<QuotationLineItem> =>
    authFetch(`/sales/quotations/${id}/line-items`, {
      method: "POST",
      body: JSON.stringify(item),
    }),

  convertToOrder: (id: string): Promise<SalesOrder> =>
    authFetch(`/sales/quotations/${id}/convert-to-order`, {
      method: "POST",
    }),

  listOrders: (): Promise<SalesOrder[]> => 
    authFetch("/sales/orders").then((res) => (Array.isArray(res) ? res : [])),

  updateOrder: (id: string, payload: Record<string, any>): Promise<SalesOrder> =>
    authFetch(`/sales/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
});
