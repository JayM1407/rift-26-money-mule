import React from 'react';
import { AlertCircle } from 'lucide-react';

// ==========================================
// RISK TABLE COMPONENT
// This shows the list of "Bad Guys" we found.
// It's a simple list that lights up red if they are dangerous.
// ==========================================

const RiskTable = ({ risks }) => {
    // If we haven't found anyone yet, show a friendly message.
    if (!risks || risks.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                <AlertCircle className="w-12 h-12 mb-2 opacity-20" />
                <p>No high-risk entities detected yet.</p>
                <p className="text-sm mt-2">Try uploading a file or loading sample data!</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-slate-800">
            {risks.map((risk) => (
                // Hover effect makes it look interactive
                <div key={risk.id} className="p-4 hover:bg-slate-800/50 transition-colors group cursor-pointer border-l-2 border-transparent hover:border-red-500">
                    <div className="flex justify-center items-center gap-2 mb-2">
                        <span className="font-mono text-lg font-bold text-white">{risk.id}</span>
                    </div>

                    {/* RISK SCORE BADGE */}
                    <div className="flex justify-center mb-2">
                        <span className={`text-md font-bold px-3 py-1 rounded-full border-2 ${risk.risk_score > 50 ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-blue-500/10 border-blue-500 text-blue-500'}`}>
                            Risk Score: {risk.risk_score}/100
                        </span>
                    </div>

                    {/* EXPLANATION TAGS */}
                    <div className="flex flex-wrap gap-2 justify-center">
                        {risk.flags.map((flag, idx) => (
                            <span key={idx} className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {flag}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RiskTable;
