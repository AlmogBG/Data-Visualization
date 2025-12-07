// src/api/metricsApi.js
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export async function getHomeSummary() {
  const res = await fetch(`${BASE_URL}/api/home/summary`);
  if (!res.ok) {
    throw new Error('Failed to fetch home summary');
  }
  return res.json();
}
