import React, { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

// ==========================================
// FORCE GRAPH VISUALIZATION
// Draws the network of bank accounts as a live graph.
// Red pulsing nodes = high suspicion (score > 70)
// Orange nodes = medium suspicion (score > 40)
// Blue nodes = normal
// ==========================================

const ForceGraphView = ({ data }) => {
    const fgRef = useRef();
    // We use a frame counter for the pulse animation effect
    const [tick, setTick] = useState(0);

    // This runs the animation loop - updates 20 times per second
    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 50); // 50ms = 20 FPS for the pulse
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (fgRef.current) {
            fgRef.current.d3Force('charge').strength(-60);
        }
    }, []);

    return (
        <div className="w-full h-full">
            <ForceGraph2D
                ref={fgRef}
                graphData={data}
                nodeLabel={(node) => `${node.id}\nSuspicion: ${node.suspicion_score || node.risk_score || 0}`}
                nodeColor={node => node.color}
                nodeVal={node => node.val}
                linkColor={() => "rgba(148, 163, 184, 0.15)"}
                linkDirectionalArrowLength={4}
                linkDirectionalArrowRelPos={1}
                linkCurvature={0.1}
                backgroundColor="#020617"

                // Custom Node Drawing: size = suspicion_score, pulse for > 70
                nodeCanvasObject={(node, ctx, globalScale) => {
                    const score = node.suspicion_score || node.risk_score || 0;
                    // Node radius mapped directly to suspicion score
                    const r = Math.max(Math.sqrt(Math.max(0, node.val || 1)) * 4, 2);

                    // PULSE EFFECT for high-risk nodes (score > 70)
                    if (score > 70) {
                        // Oscillate between 0.3 and 1.0 using a sine wave
                        const pulseAlpha = 0.3 + 0.7 * Math.abs(Math.sin(tick * 0.15));
                        const pulseRadius = r + 3 + 2 * Math.abs(Math.sin(tick * 0.15));

                        // Draw the pulsing outer ring
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, pulseRadius, 0, 2 * Math.PI, false);
                        ctx.strokeStyle = `rgba(239, 68, 68, ${pulseAlpha})`; // Red
                        ctx.lineWidth = 2.5;
                        ctx.stroke();
                    }

                    // Draw the main node circle
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                    ctx.fillStyle = node.color || '#3b82f6';
                    ctx.fill();

                    // Glow effect for any suspicious node (score > 20)
                    if (score > 20) {
                        ctx.shadowBlur = score > 70 ? 20 : 10;
                        ctx.shadowColor = node.color;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                }}
                nodeCanvasObjectMode={() => 'replace'}
                onNodeClick={node => {
                    // Zoom into clicked node
                    fgRef.current.centerAt(node.x, node.y, 1000);
                    fgRef.current.zoom(5, 2000);
                }}
            />
        </div>
    );
};

export default ForceGraphView;
