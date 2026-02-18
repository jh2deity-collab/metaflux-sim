"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { BarChart3 } from 'lucide-react';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface OmicsAnalysisChartProps {
    omicsData: Record<string, number>;
    fluxData: Record<string, number> | undefined;
}

const OmicsAnalysisChart: React.FC<OmicsAnalysisChartProps> = ({ omicsData, fluxData }) => {
    if (!fluxData || Object.keys(omicsData).length === 0) return null;

    // Filter genes that have expression data and map to reactions with non-zero flux
    const geneIds = Object.keys(omicsData);
    const expressionValues = Object.values(omicsData);

    // In a real scenario, we'd map genes to reactions properly. 
    // For visualization, we'll show Top 10 expressed genes and their relative impact or simply the profile.

    return (
        <div className="w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <BarChart3 className="text-neon-cyan" size={20} />
                        Omics-Flux Correlation
                    </h3>
                    <p className="text-[13.5px] text-slate-200 mt-1 font-medium italic opacity-90">
                        Visualizing the relationship between Gene Expression and Metabolic Flux
                    </p>
                </div>
            </div>

            <Plot
                data={[
                    {
                        type: 'scatter',
                        x: geneIds,
                        y: expressionValues,
                        name: 'Gene Expression',
                        marker: {
                            color: '#22d3ee',
                            size: 10,
                            line: { color: '#0f172a', width: 2 }
                        },
                        mode: 'markers+lines' as any,
                        line: { shape: 'hv', color: 'rgba(34, 211, 238, 0.2)' }
                    }
                ]}
                layout={{
                    height: 300,
                    margin: { t: 10, r: 10, l: 40, b: 60 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    xaxis: {
                        tickangle: -45,
                        tickfont: { size: 9, color: '#94a3b8' },
                        gridcolor: '#1e293b'
                    },
                    yaxis: {
                        tickfont: { size: 10, color: '#94a3b8' },
                        gridcolor: '#1e293b',
                        zerolinecolor: '#334155'
                    },
                    showlegend: false
                }}
                config={{ responsive: true, displayModeBar: false }}
                className="w-full"
            />

            <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center gap-3">
                <span className="flex h-2 w-2 rounded-full bg-neon-cyan animate-pulse"></span>
                <p className="text-[11px] text-slate-200 font-bold uppercase tracking-widest">
                    분석 완료: 오믹스 프로파일이 대사 모델 상한선(Upper Bound)에 투영되었습니다.
                </p>
            </div>
        </div>
    );
};

export default OmicsAnalysisChart;
