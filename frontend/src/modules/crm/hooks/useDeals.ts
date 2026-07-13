import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../../../context/AppContext";
import { Deal, Customer, Lead, User } from "../types/types";
import { getDealsApi } from "../api/dealApi";

export function useDeals() {
  const { authFetch, token } = useAppContext();
  const api = useMemo(() => getDealsApi(authFetch), [authFetch]);

  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setErrorMsg("");

      const [dealsRes, customersRes, leadsRes, usersRes] = await Promise.all([
        api.listDeals(),
        authFetch("/crm/customers").catch(() => []) as Promise<Customer[]>,
        authFetch("/crm/leads").catch(() => []) as Promise<Lead[]>,
        authFetch("/auth/users").catch(() => []) as Promise<User[]>,
      ]);

      setDeals(dealsRes);
      setCustomers(customersRes);
      setLeads(leadsRes);
      setUsers(usersRes);
    } catch (err: any) {
      setErrorMsg("Failed to retrieve sales pipeline deals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, api]);

  const addDealLocally = (newDeal: Deal) => {
    setDeals((prev) => [newDeal, ...prev]);
  };

  return {
    deals,
    setDeals,
    customers,
    leads,
    users,
    loading,
    errorMsg,
    setErrorMsg,
    loadData,
    addDealLocally,
  };
}
