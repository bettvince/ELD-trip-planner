import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function TripSheet({ form, plan }) {
  const [driverName, setDriverName] = useState("");
  const [tripStats, setTripStats] = useState({
    distance: "_________",
    time: "_________",
    stops: "_________",
  });
  const sheetRef = useRef();

  // --- Calculate totals from route data ---
  useEffect(() => {
    if (plan && plan.route_legs) {
      const totalDistance = plan.route_legs.reduce(
        (acc, leg) => acc + (leg.distance || 0),
        0
      );
      const totalTime = plan.route_legs.reduce(
        (acc, leg) => acc + (leg.duration_hours || 0),
        0
      );
      const stops = plan.route_legs.length - 1;
      setTripStats({
        distance: `${totalDistance.toFixed(1)} mi`,
        time: `${totalTime.toFixed(1)} hrs`,
        stops,
      });
    }
  }, [plan]);

  // --- Export sheet only to PDF ---
  async function downloadPDF() {
    if (!sheetRef.current) return;
    const element = sheetRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save("Trip_Plan_Sheet.pdf");
  }

  // --- Print the sheet only (no app UI) ---
  async function printOnlySheet() {
    if (!sheetRef.current) return;
    const element = sheetRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const image = canvas.toDataURL("image/png");
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Trip Plan Sheet</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: white;
              font-family: Arial, sans-serif;
            }
            img { width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <img src="${image}" />
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
  }

  return (
    <div style={{ margin: "30px auto", maxWidth: "900px" }}>
      {/* --- Printable Sheet --- */}
      <div
        ref={sheetRef}
        style={{
          background: "white",
          border: "2px solid #000",
          borderRadius: 8,
          padding: "30px",
          fontFamily: "Arial, sans-serif",
          color: "#000",
        }}
      >
        {/* --- Header with Logo --- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src="/logo.png"
              alt="Company Logo"
              style={{ width: 60, height: 60, objectFit: "contain" }}
              onError={(e) => (e.target.style.display = "none")}
            />
            <div>
              <h2 style={{ margin: 0 }}>Fleet Logistics Division</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#333" }}>
                Excellence in Route Planning & Compliance
              </p>
            </div>
          </div>
          <h3 style={{ textDecoration: "underline" }}>TRIP PLAN SHEET</h3>
        </div>

        {/* --- Data Table --- */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          <tbody>
            <tr>
              <td style={tdStyle}>Driver Name:</td>
              <td style={tdInput}>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Enter driver name"
                  style={inputStyle}
                />
              </td>
              <td style={tdStyle}>Date:</td>
              <td style={tdInput}>
                {new Date(form.start_time).toLocaleDateString()}
              </td>
            </tr>

            <tr>
              <td style={tdStyle}>Current Location:</td>
              <td style={tdInput}>{form.current_location}</td>
              <td style={tdStyle}>Pickup Location:</td>
              <td style={tdInput}>{form.pickup_location}</td>
            </tr>

            <tr>
              <td style={tdStyle}>Dropoff Location:</td>
              <td style={tdInput}>{form.dropoff_location}</td>
              <td style={tdStyle}>Start Time:</td>
              <td style={tdInput}>
                {new Date(form.start_time).toLocaleString()}
              </td>
            </tr>

            <tr>
              <td style={tdStyle}>Cycle Hours Used:</td>
              <td style={tdInput}>{form.current_cycle_hours} hrs</td>
              <td style={tdStyle}>Estimated Distance:</td>
              <td style={tdInput}>{tripStats.distance}</td>
            </tr>

            <tr>
              <td style={tdStyle}>Estimated Drive Time:</td>
              <td style={tdInput}>{tripStats.time}</td>
              <td style={tdStyle}>Stops:</td>
              <td style={tdInput}>{tripStats.stops}</td>
            </tr>
          </tbody>
        </table>

        {/* --- Signature + Footer --- */}
        <div
          style={{
            textAlign: "center",
            marginTop: "40px",
            borderTop: "1px solid #000",
            paddingTop: "12px",
          }}
        >
          <p style={{ marginBottom: "6px" }}>
            Signature: ____________________________ &nbsp;&nbsp; Date: ____________
          </p>
          <p style={{ marginTop: "10px", color: "#555" }}>
            Designed by <strong>Vincent Bett</strong>
          </p>
        </div>
      </div>

      {/* --- Action Buttons --- */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        <button style={btnPrimary} onClick={printOnlySheet}>
          🖨️ Print Sheet
        </button>
        <button style={btnSecondary} onClick={downloadPDF}>
          📄 Download PDF
        </button>
      </div>
    </div>
  );
}

// --- Styles ---
const tdStyle = {
  border: "1px solid #000",
  padding: "6px",
  fontWeight: "bold",
  width: "25%",
  background: "#f8f8f8",
};

const tdInput = {
  border: "1px solid #000",
  padding: "6px",
  height: "30px",
};

const inputStyle = {
  width: "100%",
  border: "none",
  outline: "none",
  fontSize: "13px",
  fontFamily: "inherit",
};

const btnPrimary = {
  background: "#007bff",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: 6,
  cursor: "pointer",
};

const btnSecondary = {
  background: "#28a745",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: 6,
  cursor: "pointer",
};
