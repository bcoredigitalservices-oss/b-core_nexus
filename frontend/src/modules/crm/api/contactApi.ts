import { Contact } from "../types/types";

export const getContactsApi = (authFetch: (path: string, options?: Record<string, any>) => Promise<any>) => ({
  listContacts: (): Promise<Contact[]> => 
    authFetch("/crm/contacts").then((res) => (Array.isArray(res) ? res : [])),

  createContact: (payload: Record<string, any>): Promise<Contact> =>
    authFetch("/crm/contacts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getContact: (id: string): Promise<any> => 
    authFetch(`/crm/contacts/${id}`),

  updateContact: (id: string, payload: Record<string, any>): Promise<Contact> =>
    authFetch(`/crm/contacts/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteContact: (id: string): Promise<any> =>
    authFetch(`/crm/contacts/${id}`, {
      method: "DELETE",
    }),
});
