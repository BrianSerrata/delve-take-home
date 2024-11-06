// pages/api/rls-status.js
export default async function handler(req, res) {
  try {
    const response = await fetch('http://localhost:5001/api/rls-status');
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Error fetching RLS status from backend:", error);
    res.status(500).json({ error: 'Failed to retrieve RLS status' });
  }
}