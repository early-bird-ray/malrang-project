export default function CouponIcon({ size = 20, color = "#7C3AED" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 9V6.5C2 5.67 2.67 5 3.5 5h17c.83 0 1.5.67 1.5 1.5V9c-1.1 0-2 .9-2 2s.9 2 2 2v2.5c0 .83-.67 1.5-1.5 1.5h-17C2.67 17 2 16.33 2 15.5V13c1.1 0 2-.9 2-2s-.9-2-2-2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 5v1.5M9 10v1M9 14.5V17" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeDasharray="0.5 3"/>
    </svg>
  );
}
