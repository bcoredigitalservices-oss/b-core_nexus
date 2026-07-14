import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../../../context/AppContext";
import { Customer, User } from "../types/types";
import { getCustomersApi } from "../api/customerApi";

export function useCustomers() {
  const { authFetch, token } = useAppContext();
  const api = useMemo(() => getCustomersApi(authFetch), [authFetch]);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setErrorMsg("");

      const [customersRes, usersRes] = await Promise.all([
        api.listCustomers(),
        authFetch("/auth/users").catch(() => []) as Promise<User[]>,
      ]);

      setCustomers(customersRes);
      setUsers(usersRes);
    } catch (err: any) {
      setErrorMsg("Failed to retrieve customers dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, api]);

  const addCustomerLocally = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  return {
    customers,
    setCustomers,
    users,
    loading,
    errorMsg,
    setErrorMsg,
    loadData,
    addCustomerLocally,
  };
}
