import { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ngo = {
    name: "Helping Hands Pune",
    distance: "1.2 km",
    eta: "15 mins"
  };

  const impactStory = "A warm meal reaches someone who needed it today.";

  const analyze = async () => {
    if (!input.trim()) {
      setError("Please enter food details first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ description: input })
      });

      if (!res.ok) {
        throw new Error(`Analyze request failed (${res.status})`);
      }

      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to analyze food.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px",
        background: "linear-gradient(180deg, #fffef5 0%, #f4f7ec 100%)",
        fontFamily: "Segoe UI, sans-serif"
      }}
    >
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 10px 35px rgba(44, 67, 26, 0.12)"
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: "18px" }}>🍛 GrainGain</h1>

        <input
          placeholder="Enter food details..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            padding: "12px",
            width: "100%",
            borderRadius: "10px",
            border: "1px solid #ced6c2",
            boxSizing: "border-box"
          }}
        />

        <div style={{ height: "12px" }} />

        <button
          onClick={analyze}
          disabled={loading}
          style={{
            padding: "11px 16px",
            borderRadius: "10px",
            border: "none",
            background: loading ? "#9ab29a" : "#2f7a36",
            color: "white",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Analyzing..." : "Donate Food"}
        </button>

        {error && (
          <p style={{ marginTop: "16px", color: "crimson" }}>
            {error}
          </p>
        )}

        {loading && (
          <p style={{ marginTop: "16px", color: "#444" }}>
            Checking donation urgency and expiry...
          </p>
        )}

        {data && (
          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              borderRadius: "10px",
              background: "#f5f5f5"
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "14px" }}>{data.food_type}</h3>

            <p style={{ margin: "8px 0" }}>⏱ Expires in {data.expiry_hours} hours</p>

            <p style={{ margin: "8px 0", color: data.urgency === "HIGH" ? "red" : "orange" }}>
              🚨 Urgency: {data.urgency}
            </p>

            <p style={{ margin: "8px 0" }}>📍 NGO: {ngo.name}</p>
            <p style={{ margin: "8px 0" }}>🚚 Pickup in {ngo.eta}</p>

            <p style={{ marginTop: "16px", color: "green", fontWeight: "bold" }}>
              ✨ 15 meals → 15 people fed
            </p>

            <p style={{ marginTop: "15px", fontWeight: 600 }}>✨ Impact</p>

            <p style={{ marginTop: "15px", fontStyle: "italic", color: "#555" }}>
              {impactStory}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
