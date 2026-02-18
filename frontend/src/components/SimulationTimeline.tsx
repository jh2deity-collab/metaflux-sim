"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, FastForward, SkipBack, Zap, Flame } from 'lucide-react';

interface SimulationTimelineProps {
    totalTime: number;
    currentTime: number;
    steps: number;
    isPlaying: boolean;
    playbackSpeed: number;
    onPlayPause: () => void;
    onSeek: (time: number) => void;
    onSpeedChange: () => void;
    toxicityEvents?: Array<{ time: number; byproduct: string }>;
}

const SimulationTimeline: React.FC<SimulationTimelineProps> = ({
    totalTime,
    currentTime,
    steps,
    isPlaying,
    playbackSpeed,
    onPlayPause,
    onSeek,
    onSpeedChange,
    toxicityEvents = []
}) => {
    const progressRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    // Calculate progress percentage
    const progress = Math.min(100, Math.max(0, (currentTime / totalTime) * 100));

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (progressRef.current) {
            const rect = progressRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
            onSeek(newProgress * totalTime);
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        // Optional: Implement scrub preview here
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[1000] p-4 pointer-events-none flex justify-center">
            {/* Main Container - Pointer events auto to allow interaction */}
            <div
                className="pointer-events-auto bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-4 w-full max-w-4xl flex flex-col gap-3 group transition-all hover:bg-slate-900/90 hover:border-neon-cyan/30"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                {/* Header: Time Display & Status */}
                <div className="flex justify-between items-center px-2">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-neon-green animate-pulse' : 'bg-slate-500'}`} />
                        <span className="text-[13px] font-black text-slate-200 tracking-widest uppercase font-mono">
                            T + {currentTime.toFixed(1)}h <span className="text-slate-500">/ {totalTime.toFixed(1)}h</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {toxicityEvents.length > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase animate-pulse">
                                <Flame size={10} /> Toxicity Detected
                            </div>
                        )}
                        <span className="text-[11px] font-bold text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded border border-neon-cyan/20">
                            SPEED: {playbackSpeed}x
                        </span>
                    </div>
                </div>

                {/* Timeline Bar */}
                <div
                    ref={progressRef}
                    className="relative h-2 bg-slate-800 rounded-full cursor-pointer group/bar"
                    onClick={handleTimelineClick}
                    onMouseMove={handleMouseMove}
                >
                    {/* Background Track */}
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                        {/* Toxicity Markers */}
                        {toxicityEvents.map((ev, idx) => (
                            <div
                                key={idx}
                                className="absolute top-0 bottom-0 w-1 bg-rose-500/50 hover:bg-rose-500 z-10 transition-colors"
                                style={{ left: `${(ev.time / totalTime) * 100}%` }}
                                title={`Toxicity Alert: ${ev.byproduct} at ${ev.time}h`}
                            />
                        ))}
                    </div>

                    {/* Progress Fill */}
                    <div
                        className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-blue-500 to-neon-cyan rounded-full transition-all duration-100 ease-linear shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                        style={{ width: `${progress}%` }}
                    >
                        {/* Scrubber Knob */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg scale-0 group-hover/bar:scale-100 transition-transform flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center items-center gap-6 mt-1">
                    <button
                        onClick={() => onSeek(0)}
                        className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                        title="Restart"
                    >
                        <SkipBack size={18} />
                    </button>

                    <button
                        onClick={onPlayPause}
                        className="w-12 h-12 flex items-center justify-center bg-white text-slate-950 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-neon-cyan/50"
                    >
                        {isPlaying ? (
                            <Pause size={20} className="fill-current" />
                        ) : (
                            <Play size={20} className="fill-current ml-1" />
                        )}
                    </button>

                    <button
                        onClick={onSpeedChange}
                        className="text-slate-400 hover:text-neon-cyan transition-colors p-2 hover:bg-neon-cyan/5 rounded-full flex flex-col items-center gap-0.5"
                        title="Change Speed"
                    >
                        <FastForward size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SimulationTimeline;
