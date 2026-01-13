import { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/fetch-contributions")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching contributions:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading contributions...</div>;
  if (!data) return <div>No data found</div>;

  // sort by weight descending
  const sortedUsers = [...data.outcomes].sort((a, b) => b.weight - a.weight);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Ledger Contributions Leaderboard</h1>
      <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>User</th>
            <th>Repo</th>
            <th>Message</th>
            <th>Date</th>
            <th>Weight</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((contribution, index) => (
            <tr key={index}>
              <td>{contribution.user}</td>
              <td>{contribution.repo}</td>
              <td>{contribution.message}</td>
              <td>{new Date(contribution.date).toLocaleString()}</td>
              <td>{contribution.weight}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;

