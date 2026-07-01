function StatCard({ title, value, color, icon }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-slate-700/60 hover:bg-slate-900/60 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <p className={`mt-2 text-3xl font-extrabold tracking-tight ${color || 'text-white'}`}>
            {value}
          </p>
        </div>
        {icon && (
          <div className={`rounded-lg bg-slate-950/80 p-3 text-xl ${color || 'text-white'} border border-slate-850`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;