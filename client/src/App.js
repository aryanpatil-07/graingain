import { useState, useCallback } from "react";
import { MapNearest } from "./components/MapNearest";
import { DeliverySlider } from "./components/DeliverySlider";
import { LogisticsSummary } from "./components/LogisticsSummary";
import { ScrollTruck } from "./components/ScrollTruck";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [sliderHours, setSliderHours] = useState(6);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Compute ETA in minutes from distance and timing
  const computeETA = (km, hours) => {
    // Assume average speed of 30 km/h in city traffic
    const driveTimeMinutes = Math.round((km / 30) * 60);
    const prepTime = hours * 60;
    return Math.max(5, driveTimeMinutes + prepTime);
  };

  const etaMinutes = computeETA(distanceKm, sliderHours);

  // Derive urgency from remaining expiry hours (after subtracting ETA hours)
  const deriveUrgency = (expiryHours, etaHours) => {
    const remainingHours = expiryHours - (etaHours / 60);
    if (remainingHours <= 1) return "HIGH";
    if (remainingHours <= 3) return "MEDIUM";
    return "LOW";
  };

  const urgency = data ? deriveUrgency(data.expiry_hours, etaMinutes / 60) : "MEDIUM";

  // Handle location change from map
  const handleLocationChange = useCallback((location) => {
    setUserLocation(location);
  }, []);

  // Handle nearest centre selection from map
  const handleNearestChange = useCallback((centre, distance) => {
    setSelectedCentre(centre);
    setDistanceKm(distance);
  }, []);

  // Analyze food via backend
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

  // Handle donation confirmation
  const handleDonate = () => {
    if (!selectedCentre) {
      setError("Please select a donation centre from the map.");
      return;
    }
    console.log("Donation confirmed:", {
      food: data,
      centre: selectedCentre,
      distance: distanceKm,
      eta: etaMinutes
    });
    alert(`✨ Donation confirmed! Pickup scheduled in ${etaMinutes} minutes at ${selectedCentre.name}`);
  };

  const handleRequestPickup = () => {
    if (!selectedCentre) {
      setError("Please select a donation centre from the map.");
      return;
    }
    console.log("Pickup requested:", { centre: selectedCentre });
    alert(`🚚 Pickup request sent to ${selectedCentre.name}. They will contact you soon!`);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>🍛 GrainGain</h1>
          <p>Save wasted food. Feed people. Make an impact.</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Food Input Section */}
        <section className="section section-input">
          <h2>📋 Step 1: Describe Your Food</h2>
          <div className="input-group">
            <input
              type="text"
              placeholder="e.g., '15 veg meals, cooked rice 2 hours ago'"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && analyze()}
              className="food-input"
              aria-label="Describe the food you want to donate"
            />
            <button onClick={analyze} disabled={loading} className="btn-analyze">
              {loading ? "⏳ Analyzing..." : "✨ Analyze Food"}
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
          {loading && <div className="loading-message">🔍 Checking food type, expiry, and urgency...</div>}
        </section>

        {/* Food Analysis Results */}
        {data && (
          <section className="section section-analysis">
            <h2>📊 Step 2: Food Analysis</h2>
            <div className="analysis-card">
              <div className="analysis-item">
                <span className="label">🍽 Food Type</span>
                <span className="value">{data.food_type}</span>
              </div>
              <div className="analysis-item">
                <span className="label">⏱ Safe For</span>
                <span className="value">{data.expiry_hours.toFixed(1)} hours</span>
              </div>
              <div className="analysis-item">
                <span className="label">🚨 Urgency</span>
                <span className={`value urgency-${data.urgency.toLowerCase()}`}>{data.urgency}</span>
              </div>
            </div>

            {/* Map Section */}
            <h2 style={{ marginTop: "32px" }}>📍 Step 3: Select Donation Centre</h2>
            <MapNearest
              userLocation={userLocation}
              onLocationChange={handleLocationChange}
              onNearestChange={handleNearestChange}
            />

            {/* Delivery Timing Slider */}
            <h2>⏰ Step 4: Schedule Pickup</h2>
            <DeliverySlider value={sliderHours} onChange={setSliderHours} min={0} max={24} />

            {/* Logistics Summary */}
            <LogisticsSummary
              centre={selectedCentre}
              distanceKm={distanceKm}
              etaMinutes={etaMinutes}
              foodType={data.food_type}
              expiryHours={data.expiry_hours}
              urgency={urgency}
              onDonate={handleDonate}
              onRequestPickup={handleRequestPickup}
            />
          </section>
        )}

        {/* Empty State */}
        {!data && !loading && (
          <section className="section section-empty">
            <div className="empty-state">
              <h2>🌟 How GrainGain Works</h2>
              <ol className="steps">
                <li><strong>Describe:</strong> Tell us about the food you want to donate</li>
                <li><strong>Analyze:</strong> AI determines food type and remaining shelf life</li>
                <li><strong>Select:</strong> Pick the nearest donation centre on the map</li>
                <li><strong>Schedule:</strong> Choose a pickup time that works for you</li>
                <li><strong>Donate:</strong> Confirm and make an impact</li>
              </ol>
              <p className="empty-cta">👆 Start by describing your food above!</p>
            </div>
          </section>
        )}
      </main>

      {/* Scroll Truck Animation */}
      <ScrollTruck />

      {/* Footer */}
      <footer className="app-footer">
        <p>Made with ❤️ to reduce food waste and feed communities.</p>
        <p><small>© 2025 GrainGain. All rights reserved.</small></p>
      </footer>
    </div>
  );
}

export default App;
