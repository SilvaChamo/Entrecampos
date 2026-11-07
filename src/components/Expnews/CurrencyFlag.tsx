/** Bandeiras em SVG dos países das moedas do câmbio (os emojis de bandeira não aparecem no Windows). */
const star = (cx: number, cy: number, r: number, rotate = 0) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = ((i * 36 - 90 + rotate) * Math.PI) / 180;
    const d = i % 2 === 0 ? r : r * 0.382;
    return `${(cx + d * Math.cos(a)).toFixed(2)},${(cy + d * Math.sin(a)).toFixed(2)}`;
  }).join(' ');

const FLAGS: Record<string, React.ReactNode> = {
  // Estados Unidos
  USD: (
    <>
      <rect width="30" height="20" fill="#b22234" />
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#fff" />
      ))}
      <rect width="12" height={(7 * 20) / 13} fill="#3c3b6e" />
      {[2, 6, 10].flatMap((x) => [2, 5, 8].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.7" fill="#fff" />))}
    </>
  ),
  // União Europeia
  EUR: (
    <>
      <rect width="30" height="20" fill="#039" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return <circle key={i} cx={15 + 6 * Math.sin(a)} cy={10 - 6 * Math.cos(a)} r="0.9" fill="#fc0" />;
      })}
    </>
  ),
  // China
  CNY: (
    <>
      <rect width="30" height="20" fill="#de2910" />
      <polygon points={star(5, 5, 3)} fill="#ffde00" />
      <polygon points={star(10, 2, 1, 20)} fill="#ffde00" />
      <polygon points={star(12, 4.5, 1, 45)} fill="#ffde00" />
      <polygon points={star(12, 8, 1, 20)} fill="#ffde00" />
      <polygon points={star(10, 10.5, 1, 0)} fill="#ffde00" />
    </>
  ),
  // África do Sul
  ZAR: (
    <>
      <rect width="30" height="10" fill="#de3831" />
      <rect y="10" width="30" height="10" fill="#002395" />
      <path d="M0 0L12 10L0 20M12 10H30" fill="none" stroke="#fff" strokeWidth="7" />
      <path d="M0 0L12 10L0 20M12 10H30" fill="none" stroke="#007a4d" strokeWidth="4" />
      <polygon points="0,3 0,17 8,10" fill="#000" stroke="#ffb612" strokeWidth="1.4" />
    </>
  ),
  // Reino Unido
  GBP: (
    <>
      <rect width="30" height="20" fill="#012169" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#fff" strokeWidth="4" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#c8102e" strokeWidth="1.4" />
      <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" />
      <path d="M15 0v20M0 10h30" stroke="#c8102e" strokeWidth="3.4" />
    </>
  ),
};

export default function CurrencyFlag({ code, className = '' }: { code: string; className?: string }) {
  const flag = FLAGS[code];
  if (!flag) return null;
  return (
    <svg viewBox="0 0 30 20" aria-hidden="true" className={`block shrink-0 shadow-[0_0_0_1px_rgba(0,0,0,0.15)] ${className}`}>
      {flag}
    </svg>
  );
}
