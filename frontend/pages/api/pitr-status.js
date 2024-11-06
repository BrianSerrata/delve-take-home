// pages/api/pitr-status.js
export default async function handler(req, res) {
    try {
      const response = await fetch('http://localhost:5001/api/pitr-status-all');
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Error fetching PITR status from backend:", error);
      res.status(500).json({ error: 'Failed to retrieve PITR status' });
    }
  }