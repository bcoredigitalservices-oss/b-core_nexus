import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../../../context/AppContext";
import { SalesOrder, Customer, User } from "../types/types";
import { getSalesApi } from "../api/salesApi";

export function useSalesOrders() {
  const { authFetch, token } = useAppContext();
  const api = useMemo(() => getSalesApi(authFetch), [authFetch]);

  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setErrorMsg("");

      const [ordersRes, customersRes, usersRes] = await Promise.all([
        api.listOrders(),
        authFetch("/crm/customers").catch(() => []) as Promise<Customer[]>,
        authFetch("/auth/users").catch(() => []) as Promise<User[]>,
      ]);

      setSalesOrders(ordersRes);
      setCustomers(customersRes);
      setUsers(usersRes);
    } catch (err: any) {
      setErrorMsg("Failed to retrieve sales orders dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, api]);

  const addOrderLocally = (newOrder: SalesOrder) => {
    setSalesOrders((prev) => [newOrder, ...prev]);
  };

  return {
    salesOrders,
    setSalesOrders,
    customers,
    users,
    loading,
    errorMsg,
    setErrorMsg,
    loadData,
    addOrderLocally,
  };
}
