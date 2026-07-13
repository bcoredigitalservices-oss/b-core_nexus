import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../../../context/AppContext";
import { Contact, User } from "../types/types";
import { getContactsApi } from "../api/contactApi";

export function useContacts() {
  const { authFetch, token } = useAppContext();
  const api = useMemo(() => getContactsApi(authFetch), [authFetch]);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setErrorMsg("");

      const [contactsRes, usersRes] = await Promise.all([
        api.listContacts(),
        authFetch("/auth/users").catch(() => []) as Promise<User[]>,
      ]);

      setContacts(contactsRes);
      setUsers(usersRes);
    } catch (err: any) {
      setErrorMsg("Failed to retrieve contacts list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, api]);

  const addContactLocally = (newContact: Contact) => {
    setContacts((prev) => [newContact, ...prev]);
  };

  const removeContactLocally = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  return {
    contacts,
    setContacts,
    users,
    loading,
    errorMsg,
    setErrorMsg,
    loadData,
    addContactLocally,
    removeContactLocally,
  };
}
