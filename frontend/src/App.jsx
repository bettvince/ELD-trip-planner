import React, { useState, useRef } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import MapView from "./components/MapView";
import LogGrid from "./components/LogGrid";
import TripSheet from "./components/TripSheet"; // ✅ New Sheet Component

function LocationInput({ label, value, setValue }) {
  const [suggestions, setSuggestions] = useState([]);

  async function fetchSuggestions(query) {
    if (!query) return setSuggestions([]);
    try {
      const res = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: { q: query, format: "json", addressdetails: 1, limit: 5 },
      });
      setSuggestions(res.data.map((place) => place.display_name));
    } catch (err) {
      console.error("Error fetching location suggestions:", err);
    }
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <label>{label}</label>
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          fetchSuggestions(e.target.value);
        }}
        list={`${label}-suggestions`}
        style={{
          width: "100%",
          padding: 6,
          marginTop: 4,
          border: "1px solid #ccc",
          borderRadius: 4,
        }}
      />
      <datalist id={`${label}-suggestions`}>
        {suggestions.map((s, i) => (
          <option key={i} value={s} />
        ))}
      </datalist>
    </div>
  );
}

function ELDTripPlanner() {
  const [form, setForm] = useState({
    current_location: "Green Bay, WI",
    pickup_location: "Don's Paper, WI",
    dropoff_location: "Edwardsville, IL",
    start_time: new Date().toISOString(),
    current_cycle_hours: 12,
  });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const res = await axios.post(
        (import.meta.env.VITE_API_URL || "") + "/api/plan-trip/",
        form
      );
      setPlan(res.data);
    } catch (e) {
      alert("Error contacting backend: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 18, fontFamily: "Inter, system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: 6 }}>ELD Trip Planner</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        Enter trip details and click <strong>Plan Trip</strong>.
      </p>

      {/* --- Planner Form --- */}
      <div className="panel" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div className="formCol" style={{ flex: "1 1 300px" }}>
          <LocationInput
            label="Current location"
            value={form.current_location}
            setValue={(val) => setForm({ ...form, current_location: val })}
          />
          <LocationInput
            label="Pickup location"
            value={form.pickup_location}
            setValue={(val) => setForm({ ...form, pickup_location: val })}
          />
          <LocationInput
            label="Dropoff location"
            value={form.dropoff_location}
            setValue={(val) => setForm({ ...form, dropoff_location: val })}
          />
          <div style={{ marginBottom: 12 }}>
            <label>Start time</label>
            <input
              type="datetime-local"
              value={form.start_time.substring(0, 16)}
              onChange={(e) =>
                setForm({
                  ...form,
                  start_time: new Date(e.target.value).toISOString(),
                })
              }
              style={{
                width: "100%",
                padding: 6,
                marginTop: 4,
                border: "1px solid #ccc",
                borderRadius: 4,
              }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Current cycle used (hrs)</label>
            <input
              type="number"
              value={form.current_cycle_hours}
              onChange={(e) =>
                setForm({ ...form, current_cycle_hours: Number(e.target.value) })
              }
              style={{
                width: "100%",
                padding: 6,
                marginTop: 4,
                border: "1px solid #ccc",
                borderRadius: 4,
              }}
            />
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button
              onClick={submit}
              disabled={loading}
              style={{
                background: "#007bff",
                color: "white",
                padding: "8px 16px",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              {loading ? "Planning..." : "Plan Trip"}
            </button>
          </div>
        </div>

        {/* --- Map and Logs --- */}
        <div className="mapCol" style={{ flex: "2 1 600px" }}>
          {plan ? (
            <>
              <MapView route={plan.route_legs} />
              <div style={{ marginTop: 12 }}>
                <h3>Generated Daily Logs</h3>
                <LogGrid segments={plan.segments} />
              </div>
            </>
          ) : (
            <div style={{ color: "#666", marginTop: 30 }}>
              No plan yet — create one to see route and logs.
            </div>
          )}
        </div>
      </div>

      {/* --- Printable Trip Sheet Below Map --- */}
      {plan && (
        <div style={{ marginTop: 50 }}>
          <TripSheet form={form} plan={plan} />
        </div>
      )}

      {/* --- Footer --- */}
      <footer
        style={{
          textAlign: "center",
          marginTop: 40,
          padding: 12,
          color: "#666",
          borderTop: "1px solid #ddd",
        }}
      >
        Design by <strong>Vincent Bett</strong>
      </footer>
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: "center", marginTop: 100, fontFamily: "Inter, system-ui" }}>
      <h2>Welcome to the ELD Trip Planner</h2>
      <p>Click below to begin planning your trip.</p>
      <button
        onClick={() => navigate("/eld-eldplanner")}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        🚚 Start Planning
      </button>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/eld-eldplanner" element={<ELDTripPlanner />} />
      </Routes>
    </Router>
  );
}

export default App;
