"use client";

import React from 'react';
import { Save, FolderOpen, Share2, History, RotateCcw } from 'lucide-react';

interface WorkspaceManagerProps {
    onSave: () => void;
    onLoad: () => void;
    onReset: () => void;
}

const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({ onSave, onLoad, onReset }) => {
    return (
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-2xl p-2 rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group/manager hover:border-white/20 transition-all duration-500">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-violet-500/5 to-fuchsia-500/5 opacity-50 group-hover/manager:opacity-100 transition-opacity duration-1000 pointer-events-none" />

            <div className="flex items-center px-3 py-1.5 relative group/hist border-r border-white/10 pr-4 mr-1">
                <History className="text-slate-400 group-hover/manager:text-cyan-400 transition-all duration-500 group-hover/hist:rotate-[-20deg]" size={18} />
                <div className="absolute top-1 right-3 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse opacity-0 group-hover/manager:opacity-100 transition-opacity shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={onSave}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 text-slate-300 hover:text-cyan-300 rounded-full transition-all duration-300 group/btn relative overflow-hidden"
                >
                    <Save size={16} className="group-hover/btn:scale-110 transition-transform duration-300" />
                    <span className="text-[14px] font-bold tracking-wide">연구 저장</span>
                    <div className="absolute inset-0 bg-cyan-400/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 blur-md" />
                </button>

                <button
                    onClick={onLoad}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 text-slate-300 hover:text-emerald-300 rounded-full transition-all duration-300 group/btn relative overflow-hidden"
                >
                    <FolderOpen size={16} className="group-hover/btn:scale-110 transition-transform duration-300" />
                    <span className="text-[14px] font-bold tracking-wide">불러오기</span>
                    <div className="absolute inset-0 bg-emerald-400/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 blur-md" />
                </button>

                <button
                    onClick={onReset}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 text-slate-300 hover:text-rose-300 rounded-full transition-all duration-300 group/btn relative overflow-hidden"
                >
                    <RotateCcw size={16} className="group-hover/btn:rotate-[-180deg] transition-transform duration-500" />
                    <span className="text-[14px] font-bold tracking-wide">초기화</span>
                    <div className="absolute inset-0 bg-rose-400/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 blur-md" />
                </button>
            </div>

            <div className="w-[1px] h-6 bg-white/10 mx-2" />

            <button
                className="relative p-2.5 bg-white/5 hover:bg-indigo-500 text-slate-300 hover:text-white rounded-full border border-white/5 hover:border-indigo-400 transition-all duration-300 shadow-lg group/share active:scale-95"
                title="Share Project"
            >
                <Share2 size={16} className="group-hover/share:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 to-transparent opacity-0 group-hover/share:opacity-100 transition-opacity duration-700" />
            </button>
        </div>
    );
};

export default WorkspaceManager;
