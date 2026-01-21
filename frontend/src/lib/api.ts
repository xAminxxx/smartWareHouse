// API Configuration - Use environment variable or default to localhost
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || "Request failed");
  }
  return res.json();
}

// Typed API helpers
export const api = {
  // Inventory
  getInventory: () => fetchApi("/inventory"),
  addProduct: (data: { name: string; stock: number; price: number }) => 
    fetchApi("/inventory", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: number, data: { name: string; stock: number; price: number }) => 
    fetchApi(`/inventory/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (id: number) => 
    fetchApi(`/inventory/${id}`, { method: "DELETE" }),
  
  // Chat
  getChatSessions: (userId: string | number) => fetchApi(`/chat-sessions/${userId}`),
  getChatMessages: (sessionId: number) => fetchApi(`/chat-messages/${sessionId}`),
  sendMessage: (data: { message: string; user_id?: string; session_id?: number; detected_plate?: string }) =>
    fetchApi("/chatbot-order", { method: "POST", body: JSON.stringify(data) }),
  
  // Vision
  processEntrance: (formData: FormData) => 
    fetch(`${API_BASE}/process-entrance`, { method: "POST", body: formData }).then(r => r.json()),
  
  // Health
  healthCheck: () => fetchApi("/health"),
};
