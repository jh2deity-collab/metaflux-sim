"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';

const ProcessingStatus: React.FC<{ message?: string }> = ({ message = "데이터 전송 및 연산 실행" }) => {
    return (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[10000] animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center bg-white/95 backdrop-blur-3xl rounded-full p-2 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-white/40 ring-1 ring-black/10">
                {/* Left Glowing Icon Section */}
                <div className="relative w-11 h-11 rounded-full bg-slate-950 flex items-center justify-center overflow-hidden group shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/20 to-transparent opacity-50" />
                    <span className="relative text-xl font-black text-white italic tracking-tighter drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">N</span>

                    {/* Pulsing Ring */}
                    <div className="absolute inset-0 rounded-full border border-neon-cyan/30 animate-ping opacity-20" />
                    <div className="absolute inset-0 rounded-full border-2 border-neon-cyan/20 scale-90" />
                </div>

                {/* Text Content Section */}
                <div className="pl-6 pr-8 py-2 flex items-center gap-5">
                    <span className="text-[13.5px] font-black text-slate-900 tracking-[0.2em] uppercase">
                        {message}
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    </div>
                </div>

                {/* Animated Progress Underline */}
                <div className="absolute bottom-1 left-16 right-8 h-[2px] bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-cyan w-1/3 animate-[progress_2s_infinite_linear] rounded-full shadow-[0_0_8px_rgba(34,211,238,1)]" />
                </div>
            </div>

            <style jsx>{`
                @keyframes progress {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
            `}</style>
        </div>
    );
};

export default ProcessingStatus;
