import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../../../context/AppContext";
import { Lead, Contact, User } from "../types/types";
import { getLeadsApi } from "../api/leadApi";

export function useLeads() {
  const { authFetch, token } = useAppContext();
  const api = useMemo(() => getLeadsApi(authFetch), [authFetch]);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setErrorMsg("");

      const [leadsRes, contactsRes, usersRes] = await Promise.all([
        api.listLeads(),
        authFetch("/crm/contacts").catch(() => []) as Promise<Contact[]>,
        authFetch("/auth/users").catch(() => []) as Promise<User[]>,
      ]);

      setLeads(leadsRes);
      setContacts(contactsRes);
      setUsers(usersRes);
    } catch (err: any) {
      setErrorMsg("Failed to retrieve pipeline leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, api]);

  const addLeadLocally = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev]);
  };

  const removeLeadLocally = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  return {
    leads,
    setLeads,
    contacts,
    users,
    loading,
    errorMsg,
    setErrorMsg,
    loadData,
    addLeadLocally,
    removeLeadLocally,
  };
}
