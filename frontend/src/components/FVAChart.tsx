"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface FVAChartProps {
    data: Record<string, { minimum: number; maximum: number }>;
}

const FVAChart: React.FC<FVAChartProps> = ({ data }) => {
    if (!data || Object.keys(data).length === 0) return null;

    const reactions = Object.keys(data);
    const mins = reactions.map(r => data[r].minimum);
    const maxs = reactions.map(r => data[r].maximum);

    // Sort by span width to see most flexible reactions first
    const sortedIndices = reactions.map((_, i) => i).sort((a, b) =>
        (maxs[b] - mins[b]) - (maxs[a] - mins[a])
    ).slice(0, 20); // Top 20 variable reactions

    const sortedRxns = sortedIndices.map(i => reactions[i]);
    const sortedMins = sortedIndices.map(i => mins[i]);
    const sortedMaxs = sortedIndices.map(i => maxs[i]);

    return (
        <div className="w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-neon-cyan rounded-full" />
                        FVA: Flux Variability Analysis
                    </h3>
                    <p className="text-[13.5px] text-slate-200 mt-1 font-medium italic opacity-90">
                        Top 20 reactions with highest flexibility (Min/Max range)
                    </p>
                </div>
            </div>

            <Plot
                data={[
                    {
                        type: 'bar',
                        x: sortedRxns,
                        y: sortedMins,
                        base: 0 as any,
                        marker: { color: 'rgba(255, 255, 255, 0)' }, // Transparent base
                        showlegend: false,
                        hoverinfo: 'none'
                    } as any,
                    {
                        type: 'bar',
                        x: sortedRxns,
                        y: sortedMaxs.map((max, i) => max - sortedMins[i]),
                        base: sortedMins as any,
                        marker: {
                            color: 'rgba(34, 211, 238, 0.4)',
                            line: { color: '#22d3ee', width: 1 }
                        },
                        name: 'Flux Range',
                        hovertemplate: 'Rxn: %{x}<br>Min: %{base:.4f}<br>Max: %{y+base:.4f}<extra></extra>'
                    } as any
                ]}
                layout={{
                    barmode: 'stack',
                    height: 400,
                    margin: { t: 10, r: 10, l: 60, b: 80 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    showlegend: false,
                    xaxis: {
                        tickangle: -45,
                        tickfont: { size: 11, color: '#cbd5e1' },
                        gridcolor: '#1e293b'
                    },
                    yaxis: {
                        title: { text: 'Flux Rate', font: { size: 12.5, color: '#f8fafc' } },
                        tickfont: { size: 11, color: '#cbd5e1' },
                        gridcolor: '#1e293b',
                        zerolinecolor: '#334155'
                    },
                    hoverlabel: { bgcolor: '#0f172a', bordercolor: '#1e293b', font: { color: '#f8fafc' } }
                }}
                config={{ responsive: true, displayModeBar: false }}
                className="w-full"
            />
        </div>
    );
};

export default FVAChart;
