const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/v1`;

export interface DepartmentItem {
  id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  manager_email: string | null;
  parent_id: string | null;
  parent_name: string | null;
  organization_id: string;
  status?: string;
}

export interface CreateDepartmentPayload {
  name: string;
  description?: string | null;
  manager_id?: string | null;
  parent_id?: string | null;
}

export async function fetchDepartments(token: string): Promise<DepartmentItem[]> {
  const res = await fetch(`${API_BASE}/iam/departments`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) {
    throw new Error('Failed to fetch departments');
  }
  return res.json();
}

export async function createDepartment(token: string, payload: CreateDepartmentPayload): Promise<DepartmentItem> {
  const res = await fetch(`${API_BASE}/iam/departments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.detail || 'Failed to create department');
  }
  return res.json();
}
