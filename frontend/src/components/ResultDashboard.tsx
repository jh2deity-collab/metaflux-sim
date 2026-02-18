"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { Activity, BarChart3, ListChecks, TrendingUp } from 'lucide-react';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface ResultDashboardProps {
    growthRate: number;
    byproducts: Array<{ id: string; value: number }>;
    carbonLossIndex?: number;
    shadowPrices?: Record<string, number>;
    fluxData?: Record<string, number>;
    baselineGrowthRate?: number;
    baselineByproducts?: Array<{ id: string; value: number }>;
    onSelect?: (target: { id: string, type: 'metabolite' | 'reaction' }) => void;
}

const ResultDashboard: React.FC<ResultDashboardProps> = ({
    growthRate,
    byproducts,
    carbonLossIndex = 0,
    shadowPrices = {},
    onSelect,
    baselineGrowthRate,
    baselineByproducts
}) => {
    const growthDiff = baselineGrowthRate !== undefined ? growthRate - baselineGrowthRate : null;

    return (
        <div className="flex flex-col gap-8 h-full overflow-y-auto pr-1">
            <div className="bg-slate-900/50 p-8 rounded-3xl border-2 border-slate-800 backdrop-blur-2xl shadow-2xl">
                <h3 className="text-slate-300 text-[13.5px] font-black tracking-[0.3em] flex items-center gap-3 mb-4 uppercase">
                    <Activity size={16} /> 바이오매스 성장률 (Growth Rate)
                </h3>
                <div className="flex items-baseline gap-4">
                    <p className="text-6xl font-black text-neon-green tracking-tighter drop-shadow-[0_0_15px_rgba(74,222,128,0.3)]">
                        {growthRate.toFixed(4)} <span className="text-lg font-black text-slate-500 ml-2">h⁻¹</span>
                    </p>
                    {growthDiff !== null && (
                        <div className={`text-sm font-bold px-3 py-1 rounded-lg border ${growthDiff >= 0 ? 'text-neon-green border-neon-green/30 bg-neon-green/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
                            {growthDiff >= 0 ? '+' : ''}{growthDiff.toFixed(4)}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-3xl border-2 border-slate-800 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
                    <Activity size={80} className="text-neon-cyan" />
                </div>
                <h3 className="text-slate-300 text-[12px] font-black tracking-[0.3em] flex items-center gap-3 mb-4 uppercase">
                    <TrendingUp size={14} className="text-neon-cyan" /> 탄소 유실 지수 (Carbon Loss Index)
                </h3>
                <div className="flex items-center gap-6">
                    <div className="flex-1">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-2xl font-black text-white">{carbonLossIndex.toFixed(1)}%</span>
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Efficiency Status</span>
                        </div>
                        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700 p-0.5">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,211,238,0.3)] ${carbonLossIndex < 10 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                                    carbonLossIndex < 30 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                                        'bg-gradient-to-r from-red-600 to-red-500'
                                    }`}
                                style={{ width: `${Math.min(100, carbonLossIndex)}%` }}
                            />
                        </div>
                    </div>
                    <div className="w-[1px] h-10 bg-slate-800" />
                    <div className="text-left">
                        <p className="text-[11px] text-slate-400 font-black uppercase mb-1">Risk Level</p>
                        <p className={`text-[13.5px] font-black tracking-widest ${carbonLossIndex < 10 ? 'text-emerald-400' :
                            carbonLossIndex < 30 ? 'text-yellow-400' :
                                'text-red-500'
                            }`}>
                            {carbonLossIndex < 10 ? 'OPTIMAL' : carbonLossIndex < 30 ? 'MODERATE' : 'CRITICAL'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/50 p-8 rounded-3xl border-2 border-slate-800 backdrop-blur-2xl shadow-2xl flex-1">
                <h3 className="text-slate-300 text-[13.5px] font-black tracking-[0.3em] flex items-center gap-3 mb-8 uppercase">
                    <BarChart3 size={16} /> 주요 대사산물 배출량 (Byproducts)
                </h3>
                <div className="space-y-8">
                    {byproducts.map(bp => {
                        const baselineBp = baselineByproducts?.find(b => b.id === bp.id);
                        const bpDiff = baselineBp ? bp.value - baselineBp.value : null;

                        return (
                            <button
                                key={bp.id}
                                onClick={() => onSelect?.({ id: bp.id.replace('EX_', '').replace('_e', ''), type: 'metabolite' })}
                                className="w-full text-left group transition-all"
                            >
                                <div className="flex justify-between items-end text-[13px] mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-200 font-black group-hover:text-neon-cyan transition-colors tracking-widest uppercase">{bp.id}</span>
                                        {bpDiff !== null && Math.abs(bpDiff) > 1e-6 && (
                                            <span className={`text-[11px] font-bold ${bpDiff > 0 ? 'text-neon-green' : 'text-red-400'}`}>
                                                {bpDiff > 0 ? '▲' : '▼'} {Math.abs(bpDiff).toFixed(3)}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-neon-cyan font-mono font-black text-sm">{bp.value.toFixed(3)} <span className="text-[12px] text-slate-400 font-bold ml-1">mmol/gDW/h</span></span>
                                </div>
                                <div className="w-full bg-slate-800/60 h-2.5 rounded-full overflow-hidden border border-slate-700 transition-colors group-hover:border-neon-cyan/50">
                                    <div
                                        className="bg-gradient-to-r from-neon-cyan/60 to-neon-cyan h-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(34,211,238,0.5)]"
                                        style={{ width: `${Math.min(100, (bp.value / 15) * 100)}%` }}
                                    />
                                </div>
                            </button>
                        );
                    })}
                    {byproducts.length === 0 && (
                        <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
                            <p className="text-[13.5px] text-slate-400 font-black tracking-widest uppercase">분석된 대사산물 데이터 없음</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-slate-900/50 p-8 rounded-3xl border-2 border-slate-800 backdrop-blur-2xl shadow-2xl">
                <h3 className="text-slate-300 text-[13.5px] font-black tracking-[0.3em] flex items-center gap-3 mb-6 uppercase">
                    <ListChecks size={16} /> 핵심 경로 분석 (Core Flux)
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between text-[12px] text-slate-300 font-black tracking-widest border-b-2 border-slate-800 pb-3 uppercase px-1">
                        <span>REACTION ID</span>
                        <span>FLUX VALUE</span>
                    </div>
                    {['PGI', 'PFK', 'PYK', 'CS', 'ICDHyr'].map(id => (
                        <div key={id} className="flex justify-between items-center text-[13px] py-1 group px-1">
                            <span className="text-slate-300 font-mono font-bold group-hover:text-white transition-colors">{id}</span>
                            <span className="text-slate-500 font-mono font-black group-hover:text-neon-green transition-colors tracking-tighter">0.0000</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ResultDashboard;
