// frontend/src/components/DriverDailyLog.jsx
import React, { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import blankLog from "../assets/blank-paper-log.png"; // ← place your PNG here

// Helper: parse "07:13 AM" or "07:13" to minutes from midnight
function parseTimeToMin(t) {
  if (!t) return 0;
  const m = ("" + t).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = (m[3] || "").toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

function minsToHoursRounded(mins) {
  if (!mins) return "0.0h";
  const hours = Math.floor(mins / 60);
  const tenths = Math.round(((mins % 60) / 60) * 10) / 10;
  return `${(hours + tenths).toFixed(1)}h`;
}

export default function DriverDailyLog({ plan = {}, onClose }) {
  const ref = useRef(null);

  // normalize plan -> data used by component
  const data = {
    date: plan.date || (new Date().toISOString().slice(0, 10)),
    driver: plan.driver || "Driver Name",
    carrier: plan.carrier || "Carrier Name",
    tractor: plan.tractor || "",
    trailer: plan.trailer || "",
    total_miles: plan.total_miles ?? plan.miles ?? 0,
    segments: (plan.segments || []).map((s) => {
      // ensure each segment has startMin/endMin and durationMin
      const startMin =
        s.startMin ??
        (s.timeStart ? parseTimeToMin(s.timeStart) : s.startMin ?? (s.time ? parseTimeToMin(s.time) : 0));
      const endMin =
        s.endMin ??
        (s.timeEnd ? parseTimeToMin(s.timeEnd) : (s.durationMin ? startMin + s.durationMin : startMin + 30));
      return {
        ...s,
        startMin,
        endMin,
        durationMin: (s.durationMin || (endMin - startMin) || 0),
      };
    }),
    remarks_lines: plan.remarks_lines || [],
  };

  // Render colored timeline bars on top of the template grid (24h scale)
  function renderTimelineBars() {
    return data.segments.map((s, i) => {
      const leftPct = (s.startMin / 1440) * 100;
      const widthPct = ((s.endMin - s.startMin) / 1440) * 100;
      const status = (s.status || "").toUpperCase();
      let bg = "rgba(240,200,60,0.9)"; // ON DUTY default
      if (status.includes("DRIV")) bg = "rgba(220,60,60,0.9)";
      else if (status.includes("SLEEP")) bg = "rgba(60,140,220,0.9)";
      else if (status.includes("OFF")) bg = "rgba(120,120,120,0.8)";
      return (
        <div
          key={i}
          title={`${s.time || ""} ${s.status || ""} ${s.location || ""}`}
          style={{
            position: "absolute",
            left: `${leftPct}%`,
            width: `${Math.max(widthPct, 0.4)}%`,
            top: 0,
            bottom: 0,
            background: bg,
            borderRadius: 3,
            border: "1px solid rgba(0,0,0,0.08)",
            opacity: 0.95,
          }}
        />
      );
    });
  }

  // Print (browser)
  function handlePrint() {
    window.print();
  }

  // Download as PDF using html2canvas + jsPDF
  async function handleDownloadPDF() {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    // multi-page support (simple)
    let heightLeft = imgHeight - pdf.internal.pageSize.getHeight();
    let position = 0;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }
    const filename = `DriverDailyLog_${data.date}.pdf`;
    pdf.save(filename);
  }

  // compute totals per status
  const totals = data.segments.reduce(
    (acc, s) => {
      const key =
        s.status && s.status.toUpperCase().includes("DRIV")
          ? "DRIVING"
          : s.status && s.status.toUpperCase().includes("SLEEP")
          ? "SLEEPER"
          : s.status && s.status.toUpperCase().includes("OFF")
          ? "OFF_DUTY"
          : "ON_DUTY";
      acc[key] = (acc[key] || 0) + (s.durationMin || 0);
      return acc;
    },
    { OFF_DUTY: 0, SLEEPER: 0, DRIVING: 0, ON_DUTY: 0 }
  );

  // Main render
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 8 }}>
      <div style={{ width: "100%", maxWidth: 820 }}>
        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 8 }}>
          <button onClick={handlePrint} style={btnStyle}>
            Print
          </button>
          <button onClick={handleDownloadPDF} style={{ ...btnStyle, background: "#6f42c1" }}>
            Download PDF
          </button>
          {onClose && (
            <button onClick={onClose} style={{ ...btnStyle, background: "#888" }}>
              Close
            </button>
          )}
        </div>

        {/* Sheet area */}
        <div
          id="driver-daily-log-sheet"
          ref={ref}
          style={{
            position: "relative",
            width: "100%",
            backgroundImage: `url(${blankLog})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center top",
            paddingTop: "141%", // aspect ratio placeholder (tweak if necessary)
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            backgroundColor: "#fff",
          }}
        >
          {/* Header left: From / To */}
          <div style={{ position: "absolute", left: "6%", top: "6%", width: "46%", fontSize: 12 }}>
            <div>
              <strong>From:</strong> {data.segments[0]?.location || data.current_location || ""}
            </div>
            <div style={{ marginTop: 6 }}>
              <strong>To:</strong> {data.segments[data.segments.length - 1]?.location || data.dropoff_location || ""}
            </div>
          </div>

          {/* Header right: Carrier / Tractor / Miles */}
          <div style={{ position: "absolute", right: "6%", top: "6%", width: "36%", fontSize: 12, textAlign: "right" }}>
            <div>
              <strong>Name of Carrier:</strong> {data.carrier}
            </div>
            <div style={{ marginTop: 6 }}>
              <strong>Tractor/Trailer:</strong> {data.tractor || "—"} / {data.trailer || "—"}
            </div>
            <div style={{ marginTop: 6 }}>
              <strong>Total Miles Driving Today:</strong> {data.total_miles}
            </div>
          </div>

          {/* Timeline overlay area (approximate area where the template timeline grid lives) */}
          <div
            style={{
              position: "absolute",
              left: "6%",
              right: "6%",
              top: "27%",
              height: "18%",
            }}
          >
            {/* background grid is part of image; we only overlay colored bars */}
            <div style={{ position: "absolute", left: 0, top: "10%", right: 0, bottom: "10%" }}>
              {renderTimelineBars()}
            </div>

            {/* right side totals */}
            <div style={{ position: "absolute", right: 6, top: -4, width: "14%", fontSize: 11 }}>
              <div>
                <strong>Off Duty:</strong> {minsToHoursRounded(totals.OFF_DUTY)}
              </div>
              <div>
                <strong>Sleeper:</strong> {minsToHoursRounded(totals.SLEEPER)}
              </div>
              <div>
                <strong>Driving:</strong> {minsToHoursRounded(totals.DRIVING)}
              </div>
              <div>
                <strong>On Duty:</strong> {minsToHoursRounded(totals.ON_DUTY)}
              </div>
            </div>
          </div>

          {/* Remarks section */}
          <div style={{ position: "absolute", left: "6%", top: "50%", width: "88%", fontSize: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Remarks</div>
            {data.segments.map((s, idx) => (
              <div key={idx} style={{ marginBottom: 4, fontSize: 11 }}>
                <span style={{ display: "inline-block", width: 88 }}>
                  {s.time ?? (s.startMin !== undefined ? `${String(Math.floor(s.startMin / 60)).padStart(2, "0")}:${String(s.startMin % 60).padStart(2, "0")}` : "")}
                </span>
                — {s.status} @{s.location} {s.remarks || s.remark || ""}
              </div>
            ))}
          </div>

          {/* Bottom recap */}
          <div style={{ position: "absolute", left: "6%", bottom: "8%", width: "88%", fontSize: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong>Date:</strong> {data.date}
              </div>
              <div>
                <strong>Driver:</strong> {data.driver}
              </div>
              <div>
                <strong>Carrier:</strong> {data.carrier}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
          Use <strong>Download PDF</strong> to save the filled sheet or <strong>Print</strong> to send to a printer.
        </div>
      </div>
    </div>
  );
}

const btnStyle = {
  background: "#007bff",
  color: "#fff",
  padding: "8px 12px",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};
