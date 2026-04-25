const BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://188.245.161.194:5000";


async function handleJson(res, fallbackMessage) {
  let data = null;

  try {
    data = await res.json();
  } catch (error) {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.message || fallbackMessage);
  }

  return data;
}

export async function getHomeSummary() {
  const res = await fetch(`${BASE_URL}/api/home/summary`);
  return handleJson(res, "Failed to fetch home summary");
}