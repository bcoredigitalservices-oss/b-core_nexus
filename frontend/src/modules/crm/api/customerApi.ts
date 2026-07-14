import { Customer } from "../types/types";

export const getCustomersApi = (authFetch: (path: string, options?: Record<string, any>) => Promise<any>) => ({
  listCustomers: (): Promise<Customer[]> => 
    authFetch("/crm/customers").then((res) => (Array.isArray(res) ? res : [])),

  createCustomer: (payload: Record<string, any>): Promise<Customer> =>
    authFetch("/crm/customers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getCustomer: (id: string): Promise<any> => 
    authFetch(`/crm/customers/${id}`),

  updateCustomer: (id: string, payload: Record<string, any>): Promise<Customer> =>
    authFetch(`/crm/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
});
