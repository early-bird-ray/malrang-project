import { Leaf } from "lucide-react";

export default function GrapeCluster({ filled, total, size = "large" }) {
  const s = size === "large" ? 22 : 14;
  const gap = size === "large" ? 3 : 2;
  const rows = [];
  let idx = 0;
  const pattern = [3, 4, 5, 5, 4, 4, 3, 3, 2, 2, 1];
  const maxItems = total || pattern.reduce((a, b) => a + b, 0);

  for (let r = 0; r < pattern.length && idx < maxItems; r++) {
    const count = Math.min(pattern[r], maxItems - idx);
    const row = [];
    for (let c = 0; c < count && idx < maxItems; c++) {
      const isFilled = idx < filled;
      row.push(
        <div key={idx} style={{
          width: s, height: s, borderRadius: "50%",
          background: isFilled
            ? `linear-gradient(135deg, #A78BFA, #7C3AED)`
            : "#EDE9FE",
          border: isFilled ? "none" : "1.5px dashed #C4B5FD",
          transition: "all 0.3s ease",
          boxShadow: isFilled ? "0 2px 4px rgba(124,58,237,0.3)" : "none",
        }} />
      );
      idx++;
    }
    rows.push(
      <div key={r} style={{ display: "flex", gap, justifyContent: "center" }}>
        {row}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap, alignItems: "center" }}>
      <div style={{ width: 4, height: 16, background: "#8B6914", borderRadius: 2, marginBottom: -2 }} />
      <Leaf size={16} color="#22C55E" style={{ marginBottom: -6, marginTop: -8 }} />
      {rows}
    </div>
  );
}
