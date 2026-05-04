import { useState, useCallback, useMemo, useEffect } from "react";
import { MapNearest } from "./components/MapNearest";
import { DeliverySlider } from "./components/DeliverySlider";
import { LogisticsSummary } from "./components/LogisticsSummary";
import { ScrollTruck } from "./components/ScrollTruck";
import HeroSection from "./components/HeroSection";
import ImpactSection from "./components/ImpactSection";
import StoryFlow from "./components/StoryFlow";
import { CENTRES } from "./data/centres";
import { RESTAURANTS } from "./data/restaurants";
import "./App.css";

const DEMO_DATA_LABEL = "AI-assumed restaurant intelligence";

function hashId(value) {
  return value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
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

  useEffect(() => {
    const elements = document.querySelectorAll(".reveal-on-scroll:not(.is-visible)");

    if (elements.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        threshold: 0.22,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    const rafId = window.requestAnimationFrame(() => {
      elements.forEach((element) => observer.observe(element));
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [data, loading]);

  const activeCentre = selectedCentre || nearestCentre;
  const activeDistanceKm = selectedCentre ? selectedDistanceKm : nearestDistanceKm;

  // Compute ETA in minutes from distance and timing
  const computeETA = (km, hours) => {
    // Assume average speed of 30 km/h in city traffic
    const driveTimeMinutes = Math.round((km / 30) * 60);
    const prepTime = hours * 60;
    return Math.max(5, driveTimeMinutes + prepTime);
  };

  const etaMinutes = computeETA(activeDistanceKm, sliderHours);

  // Derive urgency from remaining expiry hours (after subtracting ETA hours)
  const deriveUrgency = (expiryHours, etaHours) => {
    const remainingHours = expiryHours - (etaHours / 60);
    if (remainingHours <= 1) return "HIGH";
    if (remainingHours <= 3) return "MEDIUM";
    return "LOW";
  };

  const urgency = data ? deriveUrgency(data.expiry_hours, etaMinutes / 60) : "MEDIUM";

  const monitoredCentres = useMemo(
    () => CENTRES.map((centre) => estimateEnvironmentalMetrics(centre, sliderHours)),
    [sliderHours]
  );

  const restaurantNetworkMetrics = useMemo(() => {
    return RESTAURANTS.map((restaurant) => {
      const nearestNgo = monitoredCentres.reduce((closest, ngo) => {
        const currentDistance = haversine(restaurant.lat, restaurant.lng, ngo.lat, ngo.lng);
        return currentDistance < closest.distance ? { ngo, distance: currentDistance } : closest;
      }, { ngo: monitoredCentres[0], distance: Number.POSITIVE_INFINITY });

      const risk = estimateRestaurantRisk(restaurant, nearestNgo.ngo.id, sliderHours);

      return {
        ...risk,
        ngoId: nearestNgo.ngo.id,
        ngoName: nearestNgo.ngo.name,
        distanceFromNgoKm: nearestNgo.distance
      };
    });
  }, [monitoredCentres, sliderHours]);

  const environmentTotals = useMemo(() => {
    return restaurantNetworkMetrics.reduce(
      (totals, restaurant) => ({
        totalWaste: totals.totalWaste + restaurant.wasteKg,
        totalSurplusMeals: totals.totalSurplusMeals + restaurant.surplusMeals,
        totalMethaneRisk: totals.totalMethaneRisk + restaurant.methaneRiskKgCO2e,
        totalLandfillLoad: totals.totalLandfillLoad + restaurant.wasteKg * 0.84
      }),
      {
        totalWaste: 0,
        totalSurplusMeals: 0,
        totalMethaneRisk: 0,
        totalLandfillLoad: 0
      }
    );
  }, [restaurantNetworkMetrics]);

  const highImpactRestaurants = useMemo(() => {
    return [...restaurantNetworkMetrics]
      .sort((a, b) => b.wasteKg - a.wasteKg)
      .slice(0, 3);
  }, [restaurantNetworkMetrics]);

  const topRestaurantsForSelectedNgo = useMemo(() => {
    if (!activeCentre) {
      return [];
    }

    return restaurantNetworkMetrics
      .filter((restaurant) => restaurant.ngoId === activeCentre.id)
      .map((restaurant) => ({
        ...restaurant,
        distanceFromNgoKm: haversine(activeCentre.lat, activeCentre.lng, restaurant.lat, restaurant.lng)
      }))
      .sort((a, b) => a.distanceFromNgoKm - b.distanceFromNgoKm)
      .slice(0, 3);
  }, [activeCentre, restaurantNetworkMetrics]);

  const publicHealthMetrics = useMemo(() => {
    const nutritionAccessMeals = Math.round(environmentTotals.totalSurplusMeals * 0.72);
    const emergencyMealCapacity = Math.round(environmentTotals.totalSurplusMeals * 0.35);
    const affordableRoutingSavingsPct = 28;
    const qualityComplianceRate = 98;
    const crisisResponseTimeMinutes = Math.max(18, Math.round(etaMinutes * 0.75));

    return {
      nutritionAccessMeals,
      emergencyMealCapacity,
      affordableRoutingSavingsPct,
      qualityComplianceRate,
      crisisResponseTimeMinutes
    };
  }, [environmentTotals.totalSurplusMeals, etaMinutes]);


  // Handle location change from map
  const handleLocationChange = useCallback((location) => {
    setUserLocation(location);
  }, []);

  // Handle nearest centre selection from map
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

  // Analyze food via backend
  const analyze = async () => {
    if (!input.trim()) {
      setError("Please enter food details first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      console.log("🔍 DEBUG: API URL =", apiUrl);
      console.log("🔍 DEBUG: Full endpoint =", `${apiUrl}/analyze`);
      console.log("🔍 DEBUG: Request body =", { description: input });

      const res = await fetch(`${apiUrl}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ description: input })
      });

      console.log("🔍 DEBUG: Response status =", res.status);
      const responseText = await res.text();
      console.log("🔍 DEBUG: Response text =", responseText);

      let result = null;
      if (responseText.trim().length > 0) {
        try {
          result = JSON.parse(responseText);
        } catch (parseErr) {
          console.error("❌ JSON Parse Error:", parseErr);
          throw new Error(`Server returned non-JSON response: ${responseText}`);
        }
      }

      console.log("🔍 DEBUG: Response body =", result);

      if (!res.ok) {
        const responseMessage =
          result?.message ||
          result?.error ||
          responseText.trim() ||
          `Request failed with status ${res.status}`;

        throw new Error(`Analyze request failed (${res.status}): ${responseMessage}`);
      }

      if (!result) {
        throw new Error("Analyze request returned an empty response.");
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

  const handleRequestPickup = () => {
    if (!activeCentre) {
      setError("Please select an NGO from the map.");
      return;
    }
    console.log("Surplus request sent:", { ngo: activeCentre });
    alert(`Surplus request sent to ${activeCentre.name}. The team will contact you shortly.`);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>GrainGain</h1>
          <p>Data-led food rescue intelligence for climate and city health outcomes.</p>
        </div>
      </header>

      <main className="app-main">
        <HeroSection
          input={input}
          setInput={setInput}
          onAnalyze={analyze}
          loading={loading}
        />

        <ImpactSection totals={environmentTotals} />

        <StoryFlow />

        {/* Analysis / Input upgraded into glass panel */}
        <section className="section section-input full-screen-section reveal-on-scroll glass-panel">
          <h2>Step 1 — Describe the Surplus Source</h2>
          <p className="section-subtext">Type a short description and let our AI estimate safety and urgency.</p>
          <div className="input-group premium-input">
            <input
              type="text"
              placeholder="e.g., 15 vegetarian meals, cooked rice 2 hours ago"
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

        {/* Food Analysis Results */}
        {data && (
          <section className="section section-analysis full-screen-section reveal-on-scroll">
            <h2>Step 2: NGO Map and Nearby Restaurants</h2>
            <div className="analysis-card">
              <div className="analysis-item">
                <span className="label">Food Type</span>
                <span className="value">{data.food_type}</span>
              </div>
              <div className="analysis-item">
                <span className="label">Safe For</span>
                <span className="value">{data.expiry_hours.toFixed(1)} hours</span>
              </div>
              <div className="analysis-item">
                <span className="label">Urgency</span>
                <span className={`value urgency-${data.urgency.toLowerCase()}`}>{data.urgency}</span>
              </div>
            </div>

            <p className="section-subtext">
              Click an NGO on the map to reveal the three closest restaurants. Hover each restaurant to review predicted
              surplus, possible waste, and methane risk.
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
                  <article className="surplus-card mirror-card" key={restaurant.id}>
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
                <article className="surplus-card mirror-card">
                  <h3>Awaiting NGO Selection</h3>
                  <p className="surplus-location">Allow location access or click any NGO marker on the map.</p>
                </article>
              )}
            </div>

            {/* Delivery Timing Slider */}
            <h2>Step 3: Schedule Pickup</h2>
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

        {/* Empty State */}
        {!data && !loading && (
          <section className="section section-empty full-screen-section reveal-on-scroll">
            <div className="empty-state">
              <h2>How GrainGain Works</h2>
              <ol className="steps">
                <li><strong>Describe:</strong> Tell us about the food source or surplus profile</li>
                <li><strong>Analyze:</strong> AI determines food type and remaining shelf life</li>
                <li><strong>Select:</strong> Click an NGO to inspect nearby restaurant surplus and waste risk</li>
                <li><strong>Schedule:</strong> Choose a pickup time that works for you</li>
                <li><strong>Request:</strong> Ask the restaurant to release its surplus food</li>
              </ol>
              <p className="empty-cta">Start by describing your food above.</p>
            </div>
          </section>
        )}
      </main>

      <section className="section final-cta reveal-on-scroll">
        <div className="final-cta">
          <h2>Make an Impact Today</h2>
          <p className="impact-line">Request surplus food from nearby restaurants and turn excess into nourishment.</p>
          <button className="cta-btn" onClick={handleRequestPickup}>Request Surplus Food</button>
        </div>
      </section>

      {/* Scroll Truck Animation */}
      <ScrollTruck />

      {/* Footer */}
      <footer className="app-footer">
        <p>Built to reduce food waste and strengthen nutrition access across cities.</p>
        <p><small>© 2025 GrainGain. All rights reserved.</small></p>
      </footer>
    </div>
  );
}

export default App;
