export function AtlasArt({ compact = false }: { compact?: boolean }) {
  return <svg className={compact ? "atlas-art compact" : "atlas-art"} viewBox="0 0 540 330" fill="none" role="img" aria-label="A network of connected ideas, with a path toward a minimum on a learning landscape">
    <defs><pattern id={compact ? "dots-small" : "dots"} width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.9" fill="currentColor" opacity=".14" /></pattern><linearGradient id={compact ? "surface-small" : "surface"} x1="120" y1="90" x2="400" y2="300" gradientUnits="userSpaceOnUse"><stop stopColor="var(--art-fill)" stopOpacity=".8" /><stop offset="1" stopColor="var(--art-fill)" stopOpacity=".06" /></linearGradient></defs>
    <rect width="540" height="330" fill={`url(#${compact ? "dots-small" : "dots"})`} />
    <g stroke="var(--art-line)" strokeWidth="1"><path d="m80 243 192 69 205-99-188-68-209 98Z" opacity=".35" /><path d="M80 243v-83m192 152v-82m205-17v-84" strokeDasharray="4 5" opacity=".5" />
      <path d="M80 160c52-100 67-86 102-35 39 57 58 108 101 78 39-28 51-137 88-139 38-2 66 43 106 65L272 230c-42 18-65-5-100-46-33-40-62-81-92-24Z" fill={`url(#${compact ? "surface-small" : "surface"})`} />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${80 + i * 21} ${160 + i * 7.7}c52-100 67-86 102-35 39 57 58 108 101 78 39-28 51-137 88-139`} transform={`translate(0 ${i * -0.7})`} opacity={0.32 + i * 0.035} />)}
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${87 + i * 24} ${148 - 24 * Math.sin(i / 1.4)}l185 67`} opacity=".3" />)}
    </g>
    <path d="m365 87-31 28-25 38-20 33-16 14" stroke="var(--orange)" strokeWidth="2" strokeDasharray="3 5" />
    {[[365,87],[334,115],[309,153],[289,186]].map(([x,y],i) => <g key={x}><circle cx={x} cy={y} r={i === 0 ? 6 : 4} fill="var(--orange)" stroke="var(--surface)" strokeWidth="2" /></g>)}
    <circle cx="273" cy="200" r="12" fill="var(--orange)" opacity=".12" /><circle cx="273" cy="200" r="5" fill="var(--orange)" />
    <g fontFamily="var(--font-mono)" fontSize="10" fill="var(--muted)"><text x="75" y="128">LOSS</text><text x="429" y="258">WEIGHT →</text><text x="334" y="60" fill="var(--orange)">start here</text><text x="204" y="277">a little closer, each step.</text></g>
    <path d="M402 45v12m-6-6h12M119 66v10m-5-5h10" stroke="var(--art-line)" opacity=".6" />
  </svg>;
}
