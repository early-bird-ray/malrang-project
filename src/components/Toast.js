import { colors } from '../constants/colors';

export default function Toast({ message, visible, type = "success" }) {
  if (!visible) return null;
  const bgColor = type === "success" ? colors.mint : type === "warning" ? colors.gold : colors.primary;
  return (
    <div style={{
      position: "fixed", top: 48, left: "50%", transform: "translateX(-50%)",
      background: bgColor, color: "#fff", padding: "10px 20px", borderRadius: 12,
      fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: colors.shadowLg,
      animation: "slideDown 0.3s ease", maxWidth: "85vw", textAlign: "center",
    }}>
      {message}
    </div>
  );
}
