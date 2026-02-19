import React, { useState, useEffect } from 'react';
import { Upload, AlertTriangle, RefreshCw, Download, Activity } from 'lucide-react';
import axios from 'axios';
import ForceGraphView from './ForceGraphView';
import RiskTable from './RiskTable';
import FraudRingTable from './FraudRingTable';

// ==========================================
// DASHBOARD COMPONENT - "The Lab"
// Main screen that calls our Python backend
// and renders the graph + evidence locker.
// ==========================================

const Dashboard = ({ onBack }) => {
    // STATE: All our data lives here.
    // When these change, React automatically re-renders the screen.
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(false);
    const [riskSummary, setRiskSummary] = useState([]);
    const [fraudRings, setFraudRings] = useState([]);
    const [summary, setSummary] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [activeTab, setActiveTab] = useState('evidence'); // 'evidence' or 'rings'

    // API URL: uses env variable on Netlify, falls back to local in dev
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // FUNCTION: Load sample data (Demo Mode)
    const loadSampleData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/sample-data`);
            setGraphData({ nodes: res.data.nodes, links: res.data.links });
            setRiskSummary(res.data.risk_summary || []);
            setFraudRings(res.data.fraud_rings || []);
            setSummary(res.data.summary || null);
        } catch (err) {
            console.error("Failed to load sample data", err);
        } finally {
            setLoading(false);
        }
    };

    // FUNCTION: Upload a custom CSV file
    const handleFileUpload = async (file) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(`${API_URL}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setGraphData({ nodes: res.data.nodes, links: res.data.links });
            setRiskSummary(res.data.risk_summary || []);
            setFraudRings(res.data.fraud_rings || []);
            setSummary(res.data.summary || null);
        } catch (err) {
            console.error("Upload failed", err);
            alert("Upload failed. Loading sample data instead.");
            loadSampleData();
        } finally {
            setLoading(false);
        }
    };

    // FUNCTION: Download report.json
    // Calls the /report endpoint and saves it as a file
    const downloadReport = async () => {
        try {
            const res = await axios.get(`${API_URL}/report`);
            // Create a file blob and trigger a browser download
            const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'report.json'; // The file will be named report.json
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Report download failed", err);
            alert("Could not download report. Is the backend running?");
        }
    };

    // DRAG AND DROP HANDLERS
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    // Load sample data when the page first opens
    useEffect(() => {
        loadSampleData();
    }, []);

    return (
        <div className="h-screen flex flex-col bg-slate-950" onDragEnter={handleDrag}>

            {/* HEADER */}
            <header className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-8 z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors text-lg font-medium">
                        &larr; Exit Lab
                    </button>
                    <div className="h-8 w-px bg-slate-700"></div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]"></div>
                        The Lab <span className="text-slate-500 text-lg font-normal">| Live Forensics Environment</span>
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    {/* Download Report Button */}
                    <button
                        onClick={downloadReport}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-green-700 hover:bg-green-600 rounded-lg border border-green-600 transition-colors text-white"
                    >
                        <Download className="w-4 h-4" />
                        Download report.json
                    </button>

                    <button
                        onClick={loadSampleData}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Reset Simulation
                    </button>

                    <label className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer transition-colors shadow-lg shadow-blue-500/20 text-white">
                        <Upload className="w-4 h-4" />
                        Upload Evidence.csv
                        <input type="file" className="hidden" accept=".csv" onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])} />
                    </label>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Drag Overlay */}
                {dragActive && (
                    <div
                        className="absolute inset-0 z-50 bg-blue-500/30 backdrop-blur-md border-4 border-blue-400 border-dashed m-6 rounded-3xl flex items-center justify-center"
                        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    >
                        <div className="text-4xl font-bold text-white pointer-events-none">Drop CSV Evidence Here</div>
                    </div>
                )}

                {/* LEFT: GRAPH + FRAUD RING TABLE */}
                <div className="flex-1 flex flex-col overflow-hidden">

                    {/* Graph Canvas */}
                    <div className="flex-1 relative bg-slate-950">
                        <ForceGraphView data={graphData} />

                        {/* Stats Overlay */}
                        <div className="absolute top-6 left-6 p-5 bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl pointer-events-none shadow-2xl">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                <div>
                                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">Accounts</div>
                                    <div className="text-3xl font-mono font-bold text-white">{graphData.nodes.length}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">Transactions</div>
                                    <div className="text-3xl font-mono font-bold text-white">{graphData.links.length}</div>
                                </div>
                                {summary && (
                                    <>
                                        <div>
                                            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">Flagged</div>
                                            <div className="text-3xl font-mono font-bold text-red-400">{summary.suspicious_accounts_flagged}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-bold">Rings</div>
                                            <div className="text-3xl font-mono font-bold text-orange-400">{summary.fraud_rings_detected}</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* FRAUD RING INTELLIGENCE TABLE */}
                    <div className="border-t border-slate-800 bg-slate-900/60 max-h-64 overflow-auto shrink-0">
                        <div className="px-6 py-3 border-b border-slate-800 flex items-center gap-2 sticky top-0 bg-slate-900 z-10">
                            <Activity className="w-5 h-5 text-orange-400" />
                            <h3 className="font-bold text-white">Fraud Ring Intelligence</h3>
                            <span className="ml-auto text-xs text-slate-500">{fraudRings.length} rings detected</span>
                        </div>
                        <FraudRingTable fraudRings={fraudRings} />
                    </div>
                </div>

                {/* RIGHT: EVIDENCE LOCKER SIDEBAR */}
                <div className="w-[380px] border-l border-slate-800 bg-slate-900/50 backdrop-blur-sm flex flex-col shadow-2xl z-10">
                    <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-900 shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <h3 className="font-bold text-xl text-white">Evidence Locker</h3>
                        <span className="ml-auto text-xs text-slate-500">{riskSummary.length} accounts</span>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                        <RiskTable risks={riskSummary} />
                    </div>
                    <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-500 shrink-0">
                        System Status: <span className="text-green-500">ONLINE</span>
                        {summary && <span className="ml-3 text-slate-600">({summary.processing_time_seconds}s)</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
