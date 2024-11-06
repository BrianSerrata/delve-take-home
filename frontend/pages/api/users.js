// pages/api/users.js
export default async function handler(req, res) {
  try {
    const response = await fetch('http://localhost:5001/api/users');
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Error fetching users from backend:", error);
    res.status(500).json({ error: 'Failed to retrieve users with MFA status' });
  }
}