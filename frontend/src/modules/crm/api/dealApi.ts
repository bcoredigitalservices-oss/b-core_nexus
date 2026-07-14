import { Deal } from "../types/types";

export const getDealsApi = (authFetch: (path: string, options?: Record<string, any>) => Promise<any>) => ({
  listDeals: (): Promise<Deal[]> => 
    authFetch("/crm/deals").then((res) => (Array.isArray(res) ? res : [])),

  createDeal: (payload: Record<string, any>): Promise<Deal> =>
    authFetch("/crm/deals", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateDeal: (id: string, payload: Record<string, any>): Promise<Deal> =>
    authFetch(`/crm/deals/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
});
