import React, { useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const ForceGraphView = ({ data }) => {
    const fgRef = useRef();

    useEffect(() => {
        if (fgRef.current) {
            // Add collision force to prevent overlap
            fgRef.current.d3Force('charge').strength(-30);
        }
    }, []);

    return (
        <div className="w-full h-full">
            <ForceGraph2D
                ref={fgRef}
                graphData={data}
                nodeLabel="id"
                nodeColor={node => node.color}
                nodeVal={node => node.val}
                linkColor={() => "rgba(148, 163, 184, 0.2)"} // Slate-400 with opacity
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                linkCurvature={0.1}
                backgroundColor="#020617" // Slate-950

                // Custom Node Rendering for "Glow" effect
                nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.id;
                    const fontSize = 12 / globalScale;

                    // Draw Node
                    ctx.beginPath();
                    const r = Math.sqrt(Math.max(0, node.val || 1)) * 4;
                    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                    ctx.fillStyle = node.color || '#3b82f6';
                    ctx.fill();

                    // Glow for High Risk
                    if (node.risk_score > 20) {
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = node.color;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                        ctx.fill();
                        ctx.shadowBlur = 0; // Reset
                    }

                    // Text Label
                    // ctx.font = `${fontSize}px Sans-Serif`;
                    // ctx.textAlign = 'center';
                    // ctx.textBaseline = 'middle';
                    // ctx.fillStyle = 'white';
                    // ctx.fillText(label, node.x, node.y + r + fontSize);
                }}
                nodeCanvasObjectMode={() => 'replace'}
                onNodeClick={node => {
                    // Focus on node
                    fgRef.current.centerAt(node.x, node.y, 1000);
                    fgRef.current.zoom(4, 2000);
                }}
            />
        </div>
    );
};

export default ForceGraphView;
