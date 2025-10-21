import React from "react";

function LogGrid({ segments }) {
  if (!segments || segments.length === 0) return <div>No segments</div>;

  const first = new Date(segments[0].start);
  const midnight = new Date(first);
  midnight.setHours(0, 0, 0, 0);
  const totalMinutes = 24 * 60;
  const pxWidth = 1200;
  const pxPerMin = pxWidth / totalMinutes;
  const rows = ["OFF", "SLEEPER", "DRIVING", "ON_DUTY"];
  const rowHeight = 28;

  const colorFor = (s) => {
    if (s === "DRIVING") return "#ffb703";
    if (s === "OFF") return "#90be6d";
    if (s === "SLEEPER") return "#457b9d";
    return "#f3722c";
  };

  const rects = segments.map((seg, i) => {
    const st = new Date(seg.start);
    const en = new Date(seg.end);
    const startMin = Math.max(0, (st - midnight) / 60000);
    const endMin = Math.min(totalMinutes, (en - midnight) / 60000);
    const x = startMin * pxPerMin;
    const w = Math.max(1, (endMin - startMin) * pxPerMin);
    let rowIdx = rows.indexOf(seg.status);
    if (rowIdx === -1) rowIdx = 0;
    const y = rowIdx * rowHeight + 4;
    const h = rowHeight - 8;
    return (
      <g key={i}>
        <rect x={x} y={y} width={w} height={h} fill={colorFor(seg.status)} rx={3} />
        <title>
          {seg.status} — {seg.place || ""} —{" "}
          {new Date(seg.start).toLocaleString()} →{" "}
          {new Date(seg.end).toLocaleString()}
        </title>
      </g>
    );
  });

  const remarks = segments.map((s, i) => ({
    time: new Date(s.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    status: s.status,
    place: s.place,
    note: s.note,
  }));

  return (
    <div
      style={{
        overflowX: "auto",
        border: "1px solid #eee",
        padding: 12,
        borderRadius: 8,
        background: "#fff",
      }}
    >
      <svg width={pxWidth + 200} height={rowHeight * rows.length + 40}>
        {/* Hour grid */}
        {[...Array(25)].map((_, i) => (
          <line
            key={i}
            x1={i * (pxWidth / 24)}
            x2={i * (pxWidth / 24)}
            y1={0}
            y2={rowHeight * rows.length}
            stroke="#f0f0f0"
          />
        ))}

        {/* Row labels */}
        {rows.map((r, idx) => (
          <text
            key={r}
            x={pxWidth + 10}
            y={idx * rowHeight + rowHeight / 2 + 4}
            fontSize={12}
          >
            {r.replace("_", " ")}
          </text>
        ))}

        {/* Segments */}
        <g transform="translate(0,0)">{rects}</g>
      </svg>

      <div style={{ marginTop: 10 }}>
        <h4 style={{ margin: "6px 0" }}>Remarks</h4>
        <ul>
          {remarks.map((r, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              <b>{r.time}</b> — {r.status} {r.place ? "@" + r.place : ""}{" "}
              {r.note ? `(${r.note})` : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default LogGrid;
