"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp, Activity, Info } from 'lucide-react';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface ProductionEnvelopeChartProps {
    data: any[];
    targetRxn: string;
}

const ProductionEnvelopeChart: React.FC<ProductionEnvelopeChartProps> = ({ data, targetRxn }) => {
    if (!data || data.length === 0) return null;

    const growthRates = data.map(d => d.growth_rate);
    const maxFluxes = data.map(d => d.max_flux);
    const minFluxes = data.map(d => d.min_flux);

    return (
        <div className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <TrendingUp className="text-neon-cyan" size={20} />
                    <h3 className="text-[14px] font-black text-white uppercase tracking-wider">
                        생산 포괄도 분석 (Production Envelope: {targetRxn})
                    </h3>
                </div>
                <div className="group relative">
                    <Info size={16} className="text-slate-400 cursor-help" />
                    <div className="absolute right-0 top-8 w-72 p-4 bg-slate-950 border border-slate-700/50 rounded-xl text-[11px] text-slate-200 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-2xl">
                        성장률(Growth Rate)과 목표 대사산물 생산량 사이의 트레이드오프 관계를 보여줍니다. 곡선 내부 영역이 이론적으로 가능한 대사 상태의 집합입니다.
                    </div>
                </div>
            </div>

            <div className="w-full aspect-video md:aspect-[21/9] bg-slate-950/50 rounded-xl overflow-hidden border border-slate-800/50">
                <Plot
                    data={[
                        {
                            x: growthRates,
                            y: maxFluxes,
                            type: 'scatter',
                            mode: 'lines+markers',
                            name: 'Maximum Yield',
                            line: { color: '#22d3ee', width: 3, shape: 'spline' },
                            marker: { color: '#22d3ee', size: 6 },
                            fill: 'tozeroy',
                            fillcolor: 'rgba(34, 211, 238, 0.1)'
                        },
                        {
                            x: growthRates,
                            y: minFluxes,
                            type: 'scatter',
                            mode: 'lines',
                            name: 'Minimum Yield',
                            line: { color: '#f43f5e', width: 1, dash: 'dot' },
                        }
                    ]}
                    layout={{
                        autosize: true,
                        paper_bgcolor: 'transparent',
                        plot_bgcolor: 'transparent',
                        margin: { l: 60, r: 20, t: 20, b: 60 },
                        showlegend: true,
                        legend: {
                            font: { color: '#94a3b8', size: 10 },
                            orientation: 'h',
                            y: -0.2
                        },
                        xaxis: {
                            title: { text: 'Growth Rate (h⁻¹)', font: { color: '#64748b', size: 10 } },
                            gridcolor: 'rgba(51, 65, 85, 0.2)',
                            tickfont: { color: '#64748b', size: 10 },
                            linecolor: 'rgba(51, 65, 85, 0.5)',
                        },
                        yaxis: {
                            title: { text: `Flux (${targetRxn})`, font: { color: '#64748b', size: 10 } },
                            gridcolor: 'rgba(51, 65, 85, 0.2)',
                            tickfont: { color: '#64748b', size: 10 },
                            linecolor: 'rgba(51, 65, 85, 0.5)',
                        }
                    }}
                    config={{ responsive: true, displayModeBar: false }}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/50">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter mb-1">Max Theoretical Yield</p>
                    <p className="text-xl font-black text-neon-cyan">{Math.max(...maxFluxes).toFixed(2)}</p>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/50">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter mb-1">Growth Constraint Tip</p>
                    <p className="text-[12.5px] text-slate-100 leading-tight">성장률이 {growthRates[Math.floor(growthRates.length / 2)].toFixed(2)} 지점에서 생산 최적화가 권장됩니다.</p>
                </div>
            </div>
        </div>
    );
};

export default ProductionEnvelopeChart;
