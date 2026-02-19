import React, { useState, useEffect } from 'react';
import { Upload, AlertTriangle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import ForceGraphView from './ForceGraphView';
import RiskTable from './RiskTable';

// ==========================================
// DASHBOARD COMPONENT
// This is the main screen where the magic happens.
// It manages the state (data) for the graph and the locker.
// ==========================================

const Dashboard = ({ onBack }) => {
    // STATE: This is where we store the data we get from the Python backend.
    // We use useState because when this data changes, the screen needs to update.
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(false);
    const [riskSummary, setRiskSummary] = useState([]);
    const [dragActive, setDragActive] = useState(false); // For the drag-and-drop effect

    // API URL: In production this is set via VITE_API_URL environment variable (on Netlify)
    // In dev, it defaults to localhost:8000
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // FUNCTION: Load sample data (Demo Mode)
    // We call this when the page loads so it's not empty.
    const loadSampleData = async () => {
        setLoading(true); // Turn on the loading spinner
        try {
            // Fetch data from our Python API
            const res = await axios.get(`${API_URL}/sample-data`);

            // Save the data to React State
            setGraphData({ nodes: res.data.nodes, links: res.data.links });
            setRiskSummary(res.data.risk_summary);
        } catch (err) {
            console.error("Failed to load sample data", err);
        } finally {
            setLoading(false); // Turn off the loading spinner
        }
    };

    // FUNCTION: Handle file upload
    // This sends the CSV file to the Python backend to be analyzed.
    const handleFileUpload = async (file) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(`${API_URL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            // Update the screen with the new analysis
            setGraphData({ nodes: res.data.nodes, links: res.data.links });
            setRiskSummary(res.data.risk_summary);
        } catch (err) {
            console.error("Upload failed", err);
            // If it fails (maybe connection issue), we show an alert.
            alert("Oops! Upload failed. Loading sample data instead.");
            loadSampleData();
        } finally {
            setLoading(false);
        }
    };

    // DRAG AND DROP HANDLERS
    // (We found this code on StackOverflow to help with dragging files)
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true); // Show the blue overlay
        } else if (e.type === "dragleave") {
            setDragActive(false); // Hide the blue overlay
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]); // Send file to backend
        }
    };

    // EFFECT: This runs ONCE when the component starts.
    // It triggers the initial data load.
    useEffect(() => {
        loadSampleData();
    }, []);

    return (
        <div className="h-screen flex flex-col bg-slate-950" onDragEnter={handleDrag}>
            {/* HEADER SECTION */}
            <header className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-8 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors text-lg font-medium">
                        &larr; Exit Lab
                    </button>
                    <div className="h-8 w-px bg-slate-700 mx-2"></div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]"></div>
                        The Lab <span className="text-slate-500 text-lg font-normal">| Live Forensics Environment</span>
                    </h2>
                </div>

                <div className="flex items-center gap-4">
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

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* DRAG OVERLAY (Only shows when dragging a file) */}
                {dragActive && (
                    <div
                        className="absolute inset-0 z-50 bg-blue-500/30 backdrop-blur-md border-4 border-blue-400 border-dashed m-6 rounded-3xl flex items-center justify-center"
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <div className="text-4xl font-bold text-white drop-shadow-md pointer-events-none">Drop CSV Evidence Here to Analyze</div>
                    </div>
                )}

                {/* GRAPH VISUALIZATION */}
                <div className="flex-1 relative bg-slate-950">
                    <ForceGraphView data={graphData} />

                    {/* STATS OVERLAY BOX */}
                    <div className="absolute top-6 left-6 p-6 bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl pointer-events-none shadow-2xl">
                        <div className="text-sm text-slate-400 uppercase tracking-wider mb-1 font-bold">Active Accounts</div>
                        <div className="text-4xl font-mono font-bold text-white">{graphData.nodes.length}</div>
                        <div className="h-px bg-slate-700 my-4"></div>
                        <div className="text-sm text-slate-400 uppercase tracking-wider mb-1">Transactions</div>
                        <div className="text-4xl font-mono font-bold text-white">{graphData.links.length}</div>
                    </div>
                </div>

                {/* SIDEBAR: THE EVIDENCE LOCKER */}
                <div className="w-[400px] border-l border-slate-800 bg-slate-900/50 backdrop-blur-sm flex flex-col shadow-2xl z-10">
                    <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-900">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <h3 className="font-bold text-xl text-white">Evidence Locker</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-slate-700">
                        <RiskTable risks={riskSummary} />
                    </div>
                    {/* Footer of sidebar */}
                    <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-500">
                        System Status: <span className="text-green-500">ONLINE</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
