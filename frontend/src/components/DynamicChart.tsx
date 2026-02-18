"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { Activity, TrendingUp, FlaskConical } from 'lucide-react';

// Plotly must be loaded dynamically for SSR
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface DynamicChartProps {
    data: {
        time: number[];
        biomass: number[];
        glucose: number[];
        growthRates?: number[];
        byproducts: Record<string, number[]>;
        toxicity_alerts?: Array<{ time: number, byproduct: string, concentration: number }>;
    } | null;
}

const DynamicChart: React.FC<DynamicChartProps> = ({ data }) => {
    if (!data) {
        return (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30 gap-4 animate-pulse">
                <FlaskConical size={48} className="text-slate-700" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">시뮬레이션을 실행하여 동적 그래프를 확인하세요</p>
            </div>
        );
    }

    const plotData: any[] = [
        {
            x: data.time,
            y: data.biomass,
            name: 'Biomass (g/L)',
            type: 'scatter',
            mode: 'lines+markers',
            marker: { color: '#4ade80', size: 6 },
            line: { shape: 'spline', width: 4 },
            fill: 'tozeroy',
            fillcolor: 'rgba(74, 222, 128, 0.1)'
        },
        {
            x: data.time,
            y: data.glucose,
            name: 'Glucose (g/L)',
            yaxis: 'y2',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#38bdf8', width: 3, dash: 'dash' }
        }
    ];

    // Add Growth Rate if available
    if (data.growthRates && data.growthRates.length > 0) {
        plotData.push({
            x: data.time,
            y: data.growthRates,
            name: 'Growth Rate (h⁻¹)',
            yaxis: 'y3',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#facc15', width: 3 }
        });
    }

    // Add significant byproducts
    Object.entries(data.byproducts).forEach(([id, values], index) => {
        if (Math.max(...values) > 0.01) {
            plotData.push({
                x: data.time,
                y: values,
                name: id,
                type: 'scatter',
                mode: 'lines',
                line: { width: 2, opacity: 0.6 }
            });
        }
    });

    // Add Toxicity Alerts
    if (data.toxicity_alerts && data.toxicity_alerts.length > 0) {
        plotData.push({
            x: data.toxicity_alerts.map(a => a.time),
            y: data.toxicity_alerts.map(a => {
                const idx = data.time.indexOf(a.time);
                return data.biomass[idx] || 0;
            }),
            name: 'Toxicity Warning',
            type: 'scatter',
            mode: 'markers',
            marker: {
                symbol: 'x',
                color: '#ef4444',
                size: 12,
                line: { color: 'white', width: 1 }
            },
            hoverinfo: 'text',
            text: data.toxicity_alerts.map(a => `[CRITICAL] ${a.byproduct}: ${a.concentration.toFixed(1)} mmol/L`)
        });
    }

    const layout = {
        template: 'plotly_dark' as any,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { l: 60, r: 100, t: 30, b: 60 },
        hovermode: 'x unified' as any,
        showlegend: true,
        legend: {
            orientation: 'h' as any,
            y: -0.2,
            font: { color: '#94a3b8', size: 10, family: 'Inter, sans-serif' }
        },
        font: { family: 'Inter, sans-serif' },
        xaxis: {
            title: { text: 'Time (hours)' },
            gridcolor: 'rgba(255,255,255,0.05)',
            zeroline: false,
            tickfont: { color: '#64748b' }
        },
        yaxis: {
            title: { text: 'Biomass (g/L)' },
            gridcolor: 'rgba(255,255,255,0.05)',
            zeroline: false,
            tickfont: { color: '#4ade80' }
        },
        yaxis2: {
            title: { text: 'Glucose (g/L)' },
            overlaying: 'y' as const,
            side: 'right' as const,
            gridcolor: 'rgba(255,255,255,0)',
            zeroline: false,
            tickfont: { color: '#38bdf8' }
        },
        yaxis3: {
            title: { text: 'Growth Rate (h⁻¹)' },
            overlaying: 'y' as const,
            side: 'right' as const,
            anchor: 'free' as const,
            position: 0.95,
            gridcolor: 'rgba(255,255,255,0)',
            zeroline: false,
            tickfont: { color: '#facc15' }
        }
    };

    return (
        <div className="h-full bg-slate-900/50 p-6 rounded-3xl border-2 border-slate-800 backdrop-blur-2xl shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-slate-300 text-[13.5px] font-black tracking-[0.3em] flex items-center gap-3 uppercase">
                    <TrendingUp size={16} /> 배양 성장 곡선 (Dynamic Growth Curve)
                </h3>
            </div>
            <div className="flex-1 w-full min-h-[300px]">
                <Plot
                    data={plotData}
                    layout={layout}
                    useResizeHandler={true}
                    className="w-full h-full"
                    config={{ displayModeBar: false }}
                />
            </div>

            {data.toxicity_alerts && data.toxicity_alerts.length > 0 && (
                <div className="mt-4 p-4 bg-red-950/30 border border-red-500/30 rounded-2xl flex items-start gap-4 animate-pulse">
                    <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
                        <Activity size={20} />
                    </div>
                    <div>
                        <p className="text-[13.5px] font-black text-red-400 tracking-wider uppercase mb-1">Metabolic Toxicity Detected</p>
                        <p className="text-[12.5px] text-red-100 leading-relaxed font-medium">
                            시뮬레이션 중 <b>{data.toxicity_alerts[0].byproduct}</b>가 임계 농도에 도달하여 세포 성장이 급격히 억제되기 시작했습니다. 유전적 변형을 통해 경쟁 경로를 차단하세요.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DynamicChart;
