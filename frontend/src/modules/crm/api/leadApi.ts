import { Lead } from "../types/types";

export const getLeadsApi = (authFetch: (path: string, options?: Record<string, any>) => Promise<any>) => ({
  listLeads: (): Promise<Lead[]> => 
    authFetch("/crm/leads").then((res) => (Array.isArray(res) ? res : [])),

  createLead: (payload: Record<string, any>): Promise<Lead> =>
    authFetch("/crm/leads", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getLead: (id: string): Promise<any> => 
    authFetch(`/crm/leads/${id}`),

  updateLead: (id: string, payload: Record<string, any>): Promise<Lead> =>
    authFetch(`/crm/leads/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteLead: (id: string): Promise<any> =>
    authFetch(`/crm/leads/${id}`, {
      method: "DELETE",
    }),
});
