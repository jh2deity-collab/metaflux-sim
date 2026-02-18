"use client";

import React from 'react';
import { X, ArrowRight, Zap, Target, Ban, Network } from 'lucide-react';

interface VisualFlowNode {
    from: string;
    to: string;
    type: 'blocked' | 'enhanced';
}

interface RationaleData {
    mechanism: string;
    description: string;
    visual_flow: VisualFlowNode[];
}

interface XAIExplainerProps {
    isOpen: boolean;
    onClose: () => void;
    strategyName: string;
    rationale: RationaleData;
}

const XAIExplainer: React.FC<XAIExplainerProps> = ({
    isOpen,
    onClose,
    strategyName,
    rationale
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[20002] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-slate-900/95 backdrop-blur-2xl rounded-[32px] border border-slate-700/50 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] p-8 animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-black tracking-widest uppercase border border-indigo-500/30">
                                Explainable AI Analysis
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">
                            Strategy Analysis: <span className="text-neon-cyan">{strategyName}</span>
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left: Description */}
                    <div className="space-y-6">
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Zap size={14} className="text-yellow-400" /> Optimization Mechanism
                            </h3>
                            <p className="text-xl font-bold text-white mb-2">
                                {rationale.mechanism}
                            </p>
                            <p className="text-[14px] text-slate-400 leading-relaxed">
                                {rationale.description}
                            </p>
                        </div>

                        <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <Target size={24} className="text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="text-[13px] font-bold text-slate-200">Goal Alignment</h4>
                                <p className="text-[12px] text-slate-500">98.5% confidence in yield increase</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Logic Visualizer */}
                    <div className="relative bg-slate-950/50 rounded-2xl border border-slate-800 p-6 flex flex-col justify-center min-h-[300px]">
                        <h3 className="absolute top-6 left-6 text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Network size={14} /> Flux Logic Tree
                        </h3>

                        <div className="space-y-4 mt-8">
                            {rationale.visual_flow.map((flow, idx) => (
                                <div key={idx} className="relative group">
                                    <div className={`p-4 rounded-xl border flex items-center justify-between relative z-10 transition-all hover:scale-105 active:scale-95
                                        ${flow.type === 'blocked'
                                            ? 'bg-rose-950/20 border-rose-500/20 hover:border-rose-500/50'
                                            : 'bg-neon-cyan/5 border-neon-cyan/20 hover:border-neon-cyan/50'}`}>

                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-slate-500 mb-1">From</span>
                                            <span className="text-[13px] font-black text-slate-200">{flow.from}</span>
                                        </div>

                                        <div className="flex flex-col items-center px-4">
                                            {flow.type === 'blocked' ? (
                                                <Ban size={20} className="text-rose-500 mb-1" />
                                            ) : (
                                                <ArrowRight size={20} className="text-neon-cyan mb-1 animate-pulse" />
                                            )}
                                        </div>

                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] uppercase font-bold text-slate-500 mb-1">To</span>
                                            <span className={`text-[13px] font-black ${flow.type === 'blocked' ? 'text-rose-400 line-through decoration-rose-500/50' : 'text-neon-cyan'}`}>
                                                {flow.to}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Connector Line (except for last) */}
                                    {idx < rationale.visual_flow.length - 1 && (
                                        <div className="w-[2px] h-4 bg-slate-800 mx-auto my-1" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default XAIExplainer;
