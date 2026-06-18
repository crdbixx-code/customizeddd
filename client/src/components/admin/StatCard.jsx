export default function StatCard({ icon: Icon, label, value, tone = 'cyan', sub }) {
  const tones = {
    cyan: 'text-cyan bg-cyan/10 border-cyan/25',
    teal: 'text-teal bg-teal/10 border-teal/25',
    amber: 'text-amber bg-amber/10 border-amber/25',
    coral: 'text-coral bg-coral/10 border-coral/25',
    violet: 'text-violet bg-violet/10 border-violet/25',
  };
  return (
    <div className="bg-panel border border-line rounded-xl2 p-4 flex items-center gap-3.5">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${tones[tone]} shrink-0`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-xl font-bold text-ink-1 leading-tight truncate">{value}</p>
        <p className="text-xs text-ink-3 truncate">{label}</p>
        {sub && <p className="text-[11px] text-ink-4 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
