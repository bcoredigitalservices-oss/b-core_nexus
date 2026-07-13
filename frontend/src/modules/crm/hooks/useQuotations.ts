import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../../../context/AppContext";
import { Quotation, Customer, User } from "../types/types";
import { getSalesApi } from "../api/salesApi";

export function useQuotations() {
  const { authFetch, token } = useAppContext();
  const api = useMemo(() => getSalesApi(authFetch), [authFetch]);

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setErrorMsg("");

      const [quotationsRes, customersRes, usersRes] = await Promise.all([
        api.listQuotations(),
        authFetch("/crm/customers").catch(() => []) as Promise<Customer[]>,
        authFetch("/auth/users").catch(() => []) as Promise<User[]>,
      ]);

      setQuotations(quotationsRes);
      setCustomers(customersRes);
      setUsers(usersRes);
    } catch (err: any) {
      setErrorMsg("Failed to retrieve quotations dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, api]);

  const addQuotationLocally = (newQuotation: Quotation) => {
    setQuotations((prev) => [newQuotation, ...prev]);
  };

  return {
    quotations,
    setQuotations,
    customers,
    users,
    loading,
    errorMsg,
    setErrorMsg,
    loadData,
    addQuotationLocally,
  };
}
