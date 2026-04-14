const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchBrands() {
  const res = await fetch(`${BASE_URL}/brands`);
  return res.json();
}

export async function createBrand(brand: object) {
  const res = await fetch(`${BASE_URL}/brands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(brand),
  });
  return res.json();
}

export async function generateDocument(payload: object) {
  const res = await fetch(`${BASE_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function submitFeedback(payload: object) {
  const res = await fetch(`${BASE_URL}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export function getDownloadUrl(filename: string) {
  return `${BASE_URL}/download/${filename}`;
}
