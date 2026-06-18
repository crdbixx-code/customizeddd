const tones = {
  cyan: 'bg-cyan/10 text-cyan border-cyan/30',
  teal: 'bg-teal/10 text-teal border-teal/30',
  amber: 'bg-amber/10 text-amber border-amber/30',
  coral: 'bg-coral/10 text-coral border-coral/30',
  violet: 'bg-violet/10 text-violet border-violet/30',
  neutral: 'bg-white/5 text-ink-2 border-line-hi',
};

export default function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium uppercase tracking-wider border ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
