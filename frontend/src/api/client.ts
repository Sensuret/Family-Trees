const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface Family {
  id: number;
  name: string;
  family_code: string;
  description: string | null;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  family_id: number;
  linked_member_id: number | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Member {
  id: number;
  first_name: string;
  last_name: string;
  maiden_name: string | null;
  gender: string;
  birth_date: string | null;
  death_date: string | null;
  birth_place: string | null;
  bio: string | null;
  photo_url: string | null;
  family_id: number;
  father_id: number | null;
  mother_id: number | null;
  spouse_id: number | null;
  created_at: string;
}

export interface MemberCreate {
  first_name: string;
  last_name: string;
  maiden_name?: string | null;
  gender: string;
  birth_date?: string | null;
  death_date?: string | null;
  birth_place?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  father_id?: number | null;
  mother_id?: number | null;
  spouse_id?: number | null;
}

export interface TreeNode {
  id: number;
  first_name: string;
  last_name: string;
  gender: string;
  birth_date: string | null;
  death_date: string | null;
  photo_url: string | null;
  father_id: number | null;
  mother_id: number | null;
  spouse_id: number | null;
  children_ids: number[];
}

export interface TreeData {
  family_id: number;
  nodes: TreeNode[];
}

export interface RelationshipResult {
  member1: Member;
  member2: Member;
  relationship: string;
  path: string[];
}

export const api = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    display_name: string;
    family_code: string;
  }) => request<AuthResponse>('/auth/register-family', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { username: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  getMe: () => request<User>('/auth/me'),

  getFamily: () => request<Family>('/family'),

  getMembers: () => request<Member[]>('/members'),

  createMember: (data: MemberCreate) =>
    request<Member>('/members', { method: 'POST', body: JSON.stringify(data) }),

  getMember: (id: number) => request<Member>(`/members/${id}`),

  updateMember: (id: number, data: Partial<MemberCreate>) =>
    request<Member>(`/members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteMember: (id: number) =>
    request<void>(`/members/${id}`, { method: 'DELETE' }),

  getChildren: (id: number) => request<Member[]>(`/members/${id}/children`),

  getTree: () => request<TreeData>('/tree'),

  getRelationship: (id1: number, id2: number) =>
    request<RelationshipResult>(`/relationships/${id1}/${id2}`),
};
