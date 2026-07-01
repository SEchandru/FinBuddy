import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FaShieldAlt,
  FaFileInvoiceDollar,
  FaHeartbeat,
  FaExclamationCircle
} from 'react-icons/fa';

function InsurancePlanner() {
  const { user } = useAuth();
  const salary = user?.monthlyIncome || 60000;
  const annualIncome = salary * 12;

  // Form logs
  const [currentTermCover, setCurrentTermCover] = useState('1500000');
  const [currentHealthCover, setCurrentHealthCover] = useState('300000');
  const [hasNominee, setHasNominee] = useState(false);
  const [hasParentsCover, setHasParentsCover] = useState(false);
  const [hasCriticalIllness, setHasCriticalIllness] = useState(false);

  // Target recommendations calculations
  const targetTermRequired = Math.round(annualIncome * 10); // 10x Annual Income rule of thumb
  const targetHealthRequired = 500000; // Standard ₹5 Lakhs base

  const termShortfall = Math.max(0, targetTermRequired - parseFloat(currentTermCover || 0));
  const healthShortfall = Math.max(0, targetHealthRequired - parseFloat(currentHealthCover || 0));

  const termCoverPct = Math.min(100, Math.round((parseFloat(currentTermCover || 0) / targetTermRequired) * 100));
  const healthCoverPct = Math.min(100, Math.round((parseFloat(currentHealthCover || 0) / targetHealthRequired) * 100));

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <FaShieldAlt className="text-emerald-500 animate-pulse" /> Insurance Planner & Protection Audit
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Audit your protection gap deficits and align coverage limits with recommended industry benchmarks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Input form panel (1-Col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 h-fit">
          <div>
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <FaFileInvoiceDollar className="text-blue-500" /> Coverage Logs
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Input your active insurance policies here.</p>
          </div>

          <div className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Current Term Life Cover (₹)
              </label>
              <input
                type="number"
                value={currentTermCover}
                onChange={(e) => setCurrentTermCover(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Current Health Insurance Cover (₹)
              </label>
              <input
                type="number"
                value={currentHealthCover}
                onChange={(e) => setCurrentHealthCover(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white"
              />
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold mb-2">Protection Checklist</span>
              
              <label className="flex items-center gap-2 text-slate-400 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasNominee}
                  onChange={(e) => setHasNominee(e.target.checked)}
                  className="accent-blue-500 rounded border-slate-800 bg-slate-950 h-3.5 w-3.5"
                />
                <span>Family Nominees Configured?</span>
              </label>

              <label className="flex items-center gap-2 text-slate-400 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasParentsCover}
                  onChange={(e) => setHasParentsCover(e.target.checked)}
                  className="accent-blue-500 rounded border-slate-800 bg-slate-950 h-3.5 w-3.5"
                />
                <span>Separate Cover for Elderly Parents?</span>
              </label>

              <label className="flex items-center gap-2 text-slate-400 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCriticalIllness}
                  onChange={(e) => setHasCriticalIllness(e.target.checked)}
                  className="accent-blue-500 rounded border-slate-800 bg-slate-950 h-3.5 w-3.5"
                />
                <span>Critical Illness Rider active?</span>
              </label>
            </div>

          </div>
        </div>

        {/* Shortfall & Gauges (2-Cols) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Term Insurance Audit card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold uppercase">
                  Term life insurance audit
                </span>
                <h3 className="text-lg font-bold text-white mt-2">10x Annual Income Target</h3>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                termShortfall === 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
              }`}>
                {termShortfall === 0 ? 'FULLY COVERED' : 'DEFICIT SHORTFALL'}
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-450">Current Protection Level</span>
                <span className="text-blue-400">{termCoverPct}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-teal-500 rounded-full" style={{ width: `${termCoverPct}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Active Cover: ₹{parseFloat(currentTermCover || 0).toLocaleString()}</span>
                <span>Benchmark Target: ₹{targetTermRequired.toLocaleString()}</span>
              </div>
            </div>

            {termShortfall > 0 && (
              <div className="bg-slate-950 border border-slate-855 p-4 rounded-xl flex gap-3 text-xs leading-normal font-light">
                <FaExclamationCircle className="text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-200 font-semibold">Term Insurance shortfall of ₹{termShortfall.toLocaleString()}</p>
                  <p className="text-slate-400 mt-1">If your family relies on your income, securing a low-cost, pure Term Insurance policy is critical to cover outstanding home loans/liabilities.</p>
                </div>
              </div>
            )}
          </div>

          {/* Health Insurance Audit card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-bold uppercase">
                  Health insurance audit
                </span>
                <h3 className="text-lg font-bold text-white mt-2">₹5 Lakhs Base Protection Target</h3>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                healthShortfall === 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
              }`}>
                {healthShortfall === 0 ? 'FULLY COVERED' : 'DEFICIT SHORTFALL'}
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-450">Current Protection Level</span>
                <span className="text-purple-400">{healthCoverPct}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full" style={{ width: `${healthCoverPct}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Active Cover: ₹{parseFloat(currentHealthCover || 0).toLocaleString()}</span>
                <span>Benchmark Target: ₹{targetHealthRequired.toLocaleString()}</span>
              </div>
            </div>

            {healthShortfall > 0 && (
              <div className="bg-slate-950 border border-slate-855 p-4 rounded-xl flex gap-3 text-xs leading-normal font-light">
                <FaExclamationCircle className="text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-200 font-semibold">Health Insurance shortfall of ₹{healthShortfall.toLocaleString()}</p>
                  <p className="text-slate-400 mt-1">Medical inflation averages 15% annually in India. Relying purely on your company corporate health benefits can leave you vulnerable if you change jobs.</p>
                </div>
              </div>
            )}
          </div>

          {/* Advice card */}
          <div className="bg-gradient-to-r from-teal-900/10 to-emerald-950/10 border border-emerald-500/25 rounded-2xl p-5 flex items-start gap-4">
            <div className="p-3 bg-emerald-600/15 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
              <FaHeartbeat size={20} />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-white flex items-center gap-2">
                Protection Checklist compliance tips
              </h4>
              <ul className="text-slate-300 leading-relaxed font-light list-disc list-inside space-y-1 mt-1">
                <li>Configure **family nominees** across all bank deposits, EPF, NPS, and stock brokerage cards to ensure smooth transition files.</li>
                <li>Secure **separate healthcare policies for parents** since their high-risk profiles can drive up premiums on your own family floater schemes.</li>
                <li>Attach **critical illness riders** to secure lump-sum cash payouts upon diagnosis of major illnesses, guarding you from workspace income losses.</li>
              </ul>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default InsurancePlanner;
