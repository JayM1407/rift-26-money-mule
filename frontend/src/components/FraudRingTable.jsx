import React from 'react';
import { Shield } from 'lucide-react';

// ==========================================
// FRAUD RING INTELLIGENCE TABLE
// Shows fraud rings found by our algorithm.
// Each row = one criminal "ring" we discovered.
// ==========================================

const FraudRingTable = ({ fraudRings }) => {
    // If no rings found, show a message
    if (!fraudRings || fraudRings.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500">
                <Shield className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>No fraud rings detected yet.</p>
            </div>
        );
    }

    // Color-code by pattern type
    const patternColor = (type) => {
        if (type === 'hybrid') return 'bg-red-500/20 text-red-400 border-red-500/50';
        if (type === 'layering') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    };

    const riskColor = (score) => {
        if (score >= 70) return 'text-red-400 font-bold';
        if (score >= 40) return 'text-orange-400 font-bold';
        return 'text-blue-400';
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-700 text-left">
                        <th className="px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">Ring ID</th>
                        <th className="px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">Pattern Type</th>
                        <th className="px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">Members</th>
                        <th className="px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">Risk Score</th>
                        <th className="px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">Member Account IDs</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {/* Sort rings by risk score so scariest ones are first */}
                    {[...fraudRings].sort((a, b) => b.risk_score - a.risk_score).map((ring) => (
                        <tr key={ring.ring_id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3">
                                <span className="font-mono font-bold text-white">{ring.ring_id}</span>
                            </td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs font-bold uppercase rounded border ${patternColor(ring.pattern_type)}`}>
                                    {ring.pattern_type}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-slate-300 font-mono font-bold">
                                {ring.member_accounts.length}
                            </td>
                            <td className={`px-4 py-3 font-mono text-base ${riskColor(ring.risk_score)}`}>
                                {ring.risk_score.toFixed(1)}
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-xs font-mono max-w-xs truncate">
                                {ring.member_accounts.join(', ')}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FraudRingTable;
