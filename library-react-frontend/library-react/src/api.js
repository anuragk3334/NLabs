// All calls to the backend live here so the components stay simple.

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// Small helper so we don't repeat the fetch + error handling everywhere.
async function request(url, options) {
  const res = await fetch(url, options);

  if (!res.ok) {
    // Our backend returns { message: "..." } for errors, try to read it.
    let message = "Request failed";
    try {
      const body = await res.json();
      message = body.message || message;
    } catch (e) {
      // no body, keep default message
    }
    throw new Error(message);
  }

  // Some endpoints (like return) may send back JSON, some may be empty.
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function jsonOptions(method, body) {
  return {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// ----- Books -----
export function getBooks() {
  return request(`${BASE}/books`);
}

export function createBook(book) {
  return request(`${BASE}/books`, jsonOptions("POST", book));
}

export function updateBook(id, book) {
  return request(`${BASE}/books/${id}`, jsonOptions("PUT", book));
}

// ----- Members -----
export function getMembers() {
  return request(`${BASE}/members`);
}

export function createMember(member) {
  return request(`${BASE}/members`, jsonOptions("POST", member));
}

export function updateMember(id, member) {
  return request(`${BASE}/members/${id}`, jsonOptions("PUT", member));
}

// ----- Loans -----
export function getLoans(memberId, activeOnly) {
  const params = [];
  // Accept numeric IDs and string IDs; only skip when memberId is null/undefined.
  if (memberId != null) params.push(`memberId=${encodeURIComponent(memberId)}`);
  if (activeOnly) params.push("status=active");
  const query = params.length ? `?${params.join("&")}` : "";
  return request(`${BASE}/loans${query}`);
}

export function borrowBook(bookId, memberId) {
  return request(`${BASE}/loans/borrow`, jsonOptions("POST", { bookId, memberId }));
}

export function returnBook(loanId) {
  return request(`${BASE}/loans/${loanId}/return`, { method: "POST" });
}
