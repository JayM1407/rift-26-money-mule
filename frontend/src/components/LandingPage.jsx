import React from 'react';
import { ShieldAlert, Network, Activity, ArrowRight, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = ({ onStart }) => {
    return (
        <div className="relative overflow-hidden min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 font-sans">

            {/* 
        HERO SECTION 
        Big text to impress the judges!
      */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center mt-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="z-10 max-w-5xl"
                >
                    <div className="flex justify-center mb-8">
                        <div className="p-4 rounded-3xl bg-slate-800 border-2 border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.5)]">
                            <Network className="w-24 h-24 text-blue-400" />
                        </div>
                    </div>

                    <h1 className="text-7xl font-extrabold tracking-tight mb-6 text-white drop-shadow-lg">
                        Financial Forensic Engine
                    </h1>
                    <p className="text-3xl text-slate-300 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
                        We built an AI tool to catch money launderers using <span className="text-blue-400 font-bold">Graph Theory</span>.
                    </p>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onStart}
                        className="group relative inline-flex items-center gap-4 px-10 py-6 bg-blue-600 text-white rounded-2xl font-bold text-2xl shadow-xl hover:bg-blue-500 transition-all mb-20"
                    >
                        <span>Launch Prototype</span>
                        <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                    </motion.button>
                </motion.div>
            </div>

            {/* 
        HOW IT WORKS (Explained simply)
      */}
            <div className="bg-slate-900 py-16 px-8 border-t border-slate-800">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-white mb-12 flex items-center gap-3 justify-center">
                        <BookOpen className="w-10 h-10 text-yellow-400" />
                        How Our Algorithm Works
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Concept 1 */}
                        <div className="p-8 rounded-2xl bg-slate-800 border-2 border-slate-700 hover:border-blue-500 transition-colors">
                            <Activity className="w-12 h-12 text-red-400 mb-4" />
                            <h3 className="text-2xl font-bold text-white mb-3">1. Cycle Detection</h3>
                            <p className="text-lg text-slate-300">
                                We look for money moving in circles (A &rarr; B &rarr; C &rarr; A). This is a common trick used to hide where money came from.
                            </p>
                        </div>

                        {/* Concept 2 */}
                        <div className="p-8 rounded-2xl bg-slate-800 border-2 border-slate-700 hover:border-blue-500 transition-colors">
                            <Network className="w-12 h-12 text-blue-400 mb-4" />
                            <h3 className="text-2xl font-bold text-white mb-3">2. Smurf Detection</h3>
                            <p className="text-lg text-slate-300">
                                "Smurfing" is when one account collects small payments from many people. We find these "Hub" accounts automatically.
                            </p>
                        </div>

                        {/* Concept 3 */}
                        <div className="p-8 rounded-2xl bg-slate-800 border-2 border-slate-700 hover:border-blue-500 transition-colors">
                            <ShieldAlert className="w-12 h-12 text-green-400 mb-4" />
                            <h3 className="text-2xl font-bold text-white mb-3">3. Risk Scoring</h3>
                            <p className="text-lg text-slate-300">
                                We give every account a score from 0 to 100. If it's over 50, it turns <span className="text-red-400 font-bold">RED</span> so you can investigate.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 
        TEAM CREDITS (Student Vibe)
      */}
            <footer className="bg-slate-950 py-10 text-center border-t border-slate-900">
                <p className="text-slate-500 text-lg mb-2">Built for <span className="text-white font-bold">RIFT 2026 Cybersecurity Track</span></p>
                <p className="text-slate-600">Created by <span className="text-slate-400">Team Cyber-Detectives</span> (Jay Mehta & The AI Agent)</p>
            </footer>

        </div>
    );
};

export default LandingPage;
