import { useState, useCallback, useMemo, useEffect } from "react";
import { MapNearest } from "./components/MapNearest";
import { DeliverySlider } from "./components/DeliverySlider";
import { LogisticsSummary } from "./components/LogisticsSummary";
import { ScrollTruck } from "./components/ScrollTruck";
import HeroSection from "./components/HeroSection";
import ImpactSection from "./components/ImpactSection";
import StoryFlow from "./components/StoryFlow";
import { RoleSelector } from "./components/RoleSelector";
import { LiveDeliveryTracker } from "./components/LiveDeliveryTracker";
import { socket, joinRole, emitCreateRequest } from "./services/socket";
import { initScrollReveal } from "./services/animations";
import { CENTRES } from "./data/centres";
import { RESTAURANTS } from "./data/restaurants";
import "./App.css";

const DEMO_DATA_LABEL = "Neon DB & Real-Time Intelligence";

function hashId(value) {
  return String(value).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function haversine(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function estimateRestaurantRisk(restaurant, ngoId, sliderHours) {
  const seed = hashId(`${restaurant.id}-${ngoId}`);
  const surplusMeals = Math.round(18 + (seed % 42) + sliderHours * 1.1);
  const wasteKg = Number((Math.max(6, surplusMeals * 0.34)).toFixed(1));
  const methaneRiskKgCO2e = Number((wasteKg * 2.45).toFixed(1));

  return {
    ...restaurant,
    surplusMeals,
    wasteKg,
    methaneRiskKgCO2e
  };
}

function estimateEnvironmentalMetrics(centre, sliderHours) {
  const seed = hashId(centre.id);
  const wasteKgPerDay = Number((16 + (seed % 22) + sliderHours * 0.8).toFixed(1));
  const predictedSurplusMeals = Math.round(wasteKgPerDay * 2.7);
  const methaneRiskKgCO2e = Number((wasteKgPerDay * 2.3).toFixed(1));
  const landfillLoadKg = Number((wasteKgPerDay * 0.84).toFixed(1));

  return {
    ...centre,
    wasteKgPerDay,
    predictedSurplusMeals,
    methaneRiskKgCO2e,
    landfillLoadKg,
    dataSource: DEMO_DATA_LABEL
  };
}

function App() {
  const [input, setInput] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [nearestCentre, setNearestCentre] = useState(null);
  const [nearestDistanceKm, setNearestDistanceKm] = useState(0);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [selectedDistanceKm, setSelectedDistanceKm] = useState(0);
  const [sliderHours, setSliderHours] = useState(6);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // WebSockets & Database state
  const [socketConnected, setSocketConnected] = useState(socket.connected);
  const [currentRole, setCurrentRole] = useState("donor");
  const [requests, setRequests] = useState([]);
  const [latestAlert, setLatestAlert] = useState(null);
  const [ngosList, setNgosList] = useState(CENTRES);
  const [restaurantsList, setRestaurantsList] = useState(RESTAURANTS);

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Fetch initial data from PostgreSQL DB & attach Socket listeners
  useEffect(() => {
    // Fetch NGOs from PostgreSQL DB
    fetch(`${API_BASE}/api/ngos`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setNgosList(data.map(n => ({ ...n, lat: Number(n.lat), lng: Number(n.lng) })));
        }
      })
      .catch((err) => console.log("Using static fallback NGOs:", err.message));

    // Fetch Restaurants from PostgreSQL DB
    fetch(`${API_BASE}/api/restaurants`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRestaurantsList(data.map(r => ({ ...r, lat: Number(r.lat), lng: Number(r.lng) })));
        }
      })
      .catch((err) => console.log("Using static fallback Restaurants:", err.message));

    // Fetch initial Surplus Requests from PostgreSQL DB
    fetch(`${API_BASE}/api/requests`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRequests(data);
        }
      })
      .catch((err) => console.log("Requests fetch notice:", err.message));

    // WebSockets Event Subscriptions
    const handleConnect = () => {
      setSocketConnected(true);
      joinRole(currentRole);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleRequestCreated = (newReq) => {
      setRequests((prev) => [newReq, ...prev.filter((r) => r.id !== newReq.id)]);
      setLatestAlert({
        type: "info",
        title: "📢 New Food Surplus Request Created",
        message: `Request #${newReq.id} for "${newReq.food_type}" created for ${newReq.ngo_name || "NGO"}.`
      });
    };

    const handleStatusUpdated = ({ request }) => {
      if (!request) return;
      setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, ...request } : r)));
      setLatestAlert({
        type: "info",
        title: "📢 Delivery Status Updated",
        message: `Request #${request.id} status changed to ${request.status}.`
      });
    };

    const handleDeliveryDelayed = ({ request, delay_minutes, reason }) => {
      if (!request) return;
      setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, ...request } : r)));
      setLatestAlert({
        type: "delay",
        title: "⚠️ Delivery Delay Reported",
        message: `Request #${request.id} delayed by ${delay_minutes} mins (${reason}).`
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("request_created", handleRequestCreated);
    socket.on("status_updated", handleStatusUpdated);
    socket.on("delivery_delayed", handleDeliveryDelayed);

    if (socket.connected) {
      setSocketConnected(true);
      joinRole(currentRole);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("request_created", handleRequestCreated);
      socket.off("status_updated", handleStatusUpdated);
      socket.off("delivery_delayed", handleDeliveryDelayed);
    };
  }, [API_BASE, currentRole]);

  // Anime.js scroll reveal animation observer
  useEffect(() => {
    const observer = initScrollReveal();
    return () => {
      if (observer && observer.disconnect) observer.disconnect();
    };
  }, [data, loading, requests]);

  const activeCentre = selectedCentre || nearestCentre;
  const activeDistanceKm = selectedCentre ? selectedDistanceKm : nearestDistanceKm;

  // Compute ETA in minutes from distance and timing
  const computeETA = (km, hours) => {
    const driveTimeMinutes = Math.round((km / 30) * 60);
    const prepTime = hours * 60;
    return Math.max(5, driveTimeMinutes + prepTime);
  };

  const etaMinutes = computeETA(activeDistanceKm, sliderHours);

  const deriveUrgency = (expiryHours, etaHours) => {
    const remainingHours = expiryHours - (etaHours / 60);
    if (remainingHours <= 1) return "HIGH";
    if (remainingHours <= 3) return "MEDIUM";
    return "LOW";
  };

  const urgency = data ? deriveUrgency(data.expiry_hours, etaMinutes / 60) : "MEDIUM";

  const monitoredCentres = useMemo(
    () => ngosList.map((centre) => estimateEnvironmentalMetrics(centre, sliderHours)),
    [ngosList, sliderHours]
  );

  const restaurantNetworkMetrics = useMemo(() => {
    return restaurantsList.map((restaurant) => {
      const nearestNgo = monitoredCentres.reduce((closest, ngo) => {
        const currentDistance = haversine(restaurant.lat, restaurant.lng, ngo.lat, ngo.lng);
        return currentDistance < closest.distance ? { ngo, distance: currentDistance } : closest;
      }, { ngo: monitoredCentres[0] || CENTRES[0], distance: Number.POSITIVE_INFINITY });

      const risk = estimateRestaurantRisk(restaurant, nearestNgo.ngo.id, sliderHours);

      return {
        ...risk,
        ngoId: nearestNgo.ngo.id,
        ngoName: nearestNgo.ngo.name,
        distanceFromNgoKm: nearestNgo.distance
      };
    });
  }, [restaurantsList, monitoredCentres, sliderHours]);

  const environmentTotals = useMemo(() => {
    return restaurantNetworkMetrics.reduce(
      (totals, restaurant) => ({
        totalWaste: totals.totalWaste + restaurant.wasteKg,
        totalSurplusMeals: totals.totalSurplusMeals + restaurant.surplusMeals,
        totalMethaneRisk: totals.totalMethaneRisk + restaurant.methaneRiskKgCO2e,
        totalLandfillLoad: totals.totalLandfillLoad + restaurant.wasteKg * 0.84
      }),
      { totalWaste: 0, totalSurplusMeals: 0, totalMethaneRisk: 0, totalLandfillLoad: 0 }
    );
  }, [restaurantNetworkMetrics]);

  const topRestaurantsForSelectedNgo = useMemo(() => {
    if (!activeCentre) return [];

    return restaurantNetworkMetrics
      .filter((restaurant) => restaurant.ngoId === activeCentre.id)
      .map((restaurant) => ({
        ...restaurant,
        distanceFromNgoKm: haversine(activeCentre.lat, activeCentre.lng, restaurant.lat, restaurant.lng)
      }))
      .sort((a, b) => a.distanceFromNgoKm - b.distanceFromNgoKm)
      .slice(0, 3);
  }, [activeCentre, restaurantNetworkMetrics]);

  const handleLocationChange = useCallback((location) => {
    setUserLocation(location);
  }, []);

  const handleNearestChange = useCallback((centre, distance) => {
    setNearestCentre(centre);
    setNearestDistanceKm(distance);

    if (!selectedCentre) {
      setSelectedCentre(centre);
      setSelectedDistanceKm(distance);
    }
  }, [selectedCentre]);

  const handleCentreSelect = useCallback((centre, distance) => {
    setSelectedCentre(centre);
    setSelectedDistanceKm(distance);
  }, []);

  const handleRoleSelect = (role) => {
    setCurrentRole(role);
    joinRole(role);
  };

  // AI Food Analysis
  const analyze = async () => {
    if (!input.trim()) {
      setError("Please enter food details first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: input })
      });

      const responseText = await res.text();
      let result = null;
      if (responseText.trim().length > 0) {
        result = JSON.parse(responseText);
      }

      if (!res.ok || !result) {
        throw new Error(result?.message || `Analyze request failed (${res.status})`);
      }

      setData(result);
    } catch (err) {
      console.error("❌ ERROR:", err);
      setError(err.message || "Failed to analyze food.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Real-time WebSockets Surplus Request creation
  const handleRequestPickup = () => {
    if (!activeCentre) {
      setError("Please select an NGO from the map.");
      return;
    }

    const requestPayload = {
      description: input || "Fresh food surplus donation",
      food_type: data ? data.food_type : "Prepared Meals",
      expiry_hours: data ? data.expiry_hours : 4.0,
      urgency: data ? data.urgency : "MEDIUM",
      restaurant_id: topRestaurantsForSelectedNgo[0]?.id || "rst_shivaji_1",
      ngo_id: activeCentre.id,
      ngo_name: activeCentre.name,
      eta_minutes: etaMinutes
    };

    // Emit via WebSockets
    emitCreateRequest(requestPayload);

    alert(`⚡ Real-Time WebSockets Request sent to ${activeCentre.name}! Check the Live Dispatcher below.`);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="brand-group">
            <a href="#home" className="brand-logo">
              <span className="brand-main">GRAIN</span><span className="brand-accent">GAIN</span>
            </a>
          </div>

          <nav className="header-nav">
            <a href="#home" className="nav-link">Home</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#step-1-section" className="nav-link">Restaurant</a>
            <a href="#step-2-section" className="nav-link">Surplus Map</a>
            <a href="#tracker" className="nav-link">Live Tracker</a>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="btn-connect-pill"
              onClick={() => {
                const el = document.getElementById("tracker") || document.getElementById("step-1-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Connect
            </button>
          </div>
        </div>
      </header>

      {/* Persona & WebSockets Status Selector */}
      <RoleSelector
        currentRole={currentRole}
        onSelectRole={handleRoleSelect}
        socketConnected={socketConnected}
      />

      <main className="app-main">
        <HeroSection
          onSearchClick={() => {
            const inputEl = document.getElementById("food-description-input");
            if (inputEl) {
              inputEl.focus();
              inputEl.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }}
          onFindRestaurantClick={() => {
            const el = document.getElementById("step-1-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />

        <ImpactSection totals={environmentTotals} />

        <StoryFlow />

        {/* Step 1: Input section */}
        <section id="step-1-section" className="section section-input editorial-card reveal-on-scroll editorial-section">
          <div className="section-header-editorial">
            <div>
              <span className="section-kicker">STEP 01 — SURPLUS EVALUATION</span>
              <h2 className="section-title">Describe the Surplus Source</h2>
            </div>
            <span className="editorial-chip-badge">AI Safety Scan</span>
          </div>
          <p className="section-subtext">Type a short description and let AI estimate safety window, shelf life & urgency.</p>
          <div className="input-group premium-input">
            <span style={{ fontSize: "16px", paddingLeft: "8px", color: "#71717a", display: "flex", alignItems: "center" }}>🔍</span>
            <input
              id="food-description-input"
              type="text"
              placeholder="e.g., 25 vegetarian biryani meals, prepared 1 hour ago"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyze()}
              className="food-input"
              aria-label="Describe the food you want to donate"
            />
            <button onClick={analyze} disabled={loading} className="btn-analyze btn-primary-cta">
              {loading ? "AI thinking…" : "Start Analysis"}
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </section>

        {/* Step 2 & 3: Results & Map */}
        {data && (
          <section id="step-2-section" className="section section-analysis editorial-card reveal-on-scroll editorial-section">
            <div className="section-header-editorial">
              <div>
                <span className="section-kicker">STEP 02 — SPATIAL MATCHING</span>
                <h2 className="section-title">Partner Map & Nearby Restaurants</h2>
              </div>
              <span className="editorial-chip-badge">GPS Routing</span>
            </div>

            <div className="analysis-card">
              <div className="analysis-item">
                <span className="label">Food Type</span>
                <span className="value">{data.food_type}</span>
              </div>
              <div className="analysis-item">
                <span className="label">Safe Shelf Life</span>
                <span className="value">{data.expiry_hours.toFixed(1)} hours</span>
              </div>
              <div className="analysis-item">
                <span className="label">Urgency Level</span>
                <span className={`value urgency-${data.urgency.toLowerCase()}`}>{data.urgency}</span>
              </div>
            </div>

            <p className="section-subtext">
              Select an NGO on the interactive map to view nearby surplus providers and dispatch immediate requests.
            </p>

            <MapNearest
              userLocation={userLocation}
              centres={monitoredCentres}
              restaurants={restaurantNetworkMetrics}
              selectedCentreId={activeCentre?.id}
              onLocationChange={handleLocationChange}
              onNearestChange={handleNearestChange}
              onCentreSelect={handleCentreSelect}
            />

            <div className="section-heading-row selected-ngo-row">
              <h3>{activeCentre ? activeCentre.name : "Select an NGO to view nearby restaurants"}</h3>
              {activeCentre && <span className="data-chip">Distance from you: {activeDistanceKm.toFixed(1)} km</span>}
            </div>

            <div className="surplus-cards restaurant-cards">
              {topRestaurantsForSelectedNgo.length > 0 ? (
                topRestaurantsForSelectedNgo.map((restaurant) => (
                  <article className="surplus-card" key={restaurant.id}>
                    <h3>{restaurant.name}</h3>
                    <p className="surplus-location">{restaurant.area} · {restaurant.distanceFromNgoKm.toFixed(1)} km from NGO</p>
                    <div className="surplus-metrics">
                      <span>Projected surplus: {restaurant.surplusMeals} meals/day</span>
                      <span>Possible waste: {restaurant.wasteKg.toFixed(1)} kg/day</span>
                      <span>Methane risk: {restaurant.methaneRiskKgCO2e.toFixed(1)} kg CO2e/day</span>
                    </div>
                  </article>
                ))
              ) : (
                <article className="surplus-card">
                  <h3>Awaiting Partner Selection</h3>
                  <p className="surplus-location">Click any partner marker on the map to view nearby partners.</p>
                </article>
              )}
            </div>

            <div className="section-header-editorial" style={{ marginTop: "32px" }}>
              <div>
                <span className="section-kicker">STEP 03 — DISPATCH SCHEDULE</span>
                <h2 className="section-title">Schedule Pickup Timing</h2>
              </div>
            </div>

            {/* Delivery Timing Slider */}
            <DeliverySlider value={sliderHours} onChange={setSliderHours} min={0} max={24} />

            {/* Logistics Summary */}
            <LogisticsSummary
              centre={activeCentre}
              distanceKm={activeDistanceKm}
              etaMinutes={etaMinutes}
              foodType={data.food_type}
              expiryHours={data.expiry_hours}
              urgency={urgency}
              onRequestPickup={handleRequestPickup}
            />
          </section>
        )}

        {/* Real-time WebSockets Live Delivery Tracker Section */}
        <section className="section editorial-section reveal-on-scroll">
          <LiveDeliveryTracker
            requests={requests}
            currentRole={currentRole}
            latestAlert={latestAlert}
            clearAlert={() => setLatestAlert(null)}
          />
        </section>

        {/* How it works state */}
        {!data && !loading && (
          <section className="section section-empty editorial-card reveal-on-scroll editorial-section">
            <div className="empty-state">
              <div className="section-header-editorial">
                <div>
                  <span className="section-kicker">WORKFLOW OVERVIEW</span>
                  <h2 className="section-title">How GrainGain Real-Time Rescue Works</h2>
                </div>
              </div>
              <ol className="steps">
                <li><strong>Describe Surplus:</strong> Enter food surplus details for instant AI shelf-life & safety evaluation.</li>
                <li><strong>Select Partner NGO:</strong> Pick a verified shelter or food bank to match with surplus providers.</li>
                <li><strong>Dispatch WebSockets Request:</strong> Instantly notify NGOs and driver networks with live status sync.</li>
                <li><strong>Live Track & Report Delays:</strong> Monitor 2-way real-time milestones from pickup to verified delivery.</li>
              </ol>
            </div>
          </section>
        )}
      </main>

      <section className="section final-cta reveal-on-scroll">
        <div className="final-cta-content">
          <h2>Make an Impact Today</h2>
          <p className="impact-line">Request surplus food from nearby restaurants and turn excess into nourishment across your city.</p>
          <button type="button" className="cta-btn" onClick={handleRequestPickup}>Request Surplus Food</button>
        </div>
      </section>

      <ScrollTruck />

      <footer className="app-footer">
        <p>Built with Neon PostgreSQL & Socket.io WebSockets to reduce food waste and strengthen nutrition access across cities.</p>
        <p><small>© 2026 GrainGain Network. All rights reserved.</small></p>
      </footer>
    </div>
  );
}

export default App;
