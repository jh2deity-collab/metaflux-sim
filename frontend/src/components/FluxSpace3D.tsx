"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Box, Maximize2, Minimize2, X } from 'lucide-react';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface FluxSpace3DProps {
    data: any[];
}

const FluxSpace3D: React.FC<FluxSpace3DProps> = ({ data }) => {
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsFullScreen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    if (!data || data.length === 0) return null;

    // Separate data by subsystem for coloring
    const subsystems = Array.from(new Set(data.map(d => d.subsystem)));

    const plotData = subsystems.map(ss => {
        const filtered = data.filter(d => d.subsystem === ss);
        return {
            x: filtered.map(d => d.x),
            y: filtered.map(d => d.y),
            z: filtered.map(d => d.z),
            mode: 'markers',
            name: ss,
            marker: {
                size: filtered.map(d => Math.min(15, 4 + Math.sqrt(d.value))) as any,
                opacity: 0.7,
                line: { width: 0.5, color: '#000' }
            },
            type: 'scatter3d',
            text: filtered.map(d => `${d.name}<br>Flux: ${d.value.toFixed(4)}`),
            hoverinfo: 'text+name'
        };
    });

    const headerContent = (
        <div className="flex items-center justify-between mb-8">
            <div>
                <h3 className={`${isFullScreen ? 'text-2xl' : 'text-xl'} font-black text-white flex items-center gap-3 transition-all`}>
                    <Box className="text-neon-cyan" size={isFullScreen ? 28 : 24} />
                    FluxSpace 3D Insight
                </h3>
                <p className={`${isFullScreen ? 'text-base' : 'text-sm'} text-slate-400 mt-2 font-medium opacity-80 uppercase tracking-widest transition-all`}>
                    다차원 대사 유동 클러스터링 기반 입체 분석
                </p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 text-[11px] font-black rounded-lg">PCA PROJECTION</span>
                    <span className="px-3 py-1 bg-neon-green/10 text-neon-green border border-neon-green/30 text-[11px] font-black rounded-lg">ACTIVE: {data.length} RXNS</span>
                </div>
                <button
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white transition-all hover:scale-105 active:scale-95 group"
                    title={isFullScreen ? "축소하기 (Esc)" : "전체 화면으로 보기"}
                >
                    {isFullScreen ? <Minimize2 size={20} className="text-slate-400 group-hover:text-white" /> : <Maximize2 size={20} className="text-slate-400 group-hover:text-white" />}
                </button>
            </div>
        </div>
    );

    const statsContent = (
        <div className={`mt-8 grid grid-cols-3 gap-6 pt-8 border-t border-white/5 ${isFullScreen ? 'max-w-4xl mx-auto' : ''}`}>
            <div className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Cluster Distribution</span>
                <span className={`${isFullScreen ? 'text-lg' : 'text-sm'} font-black text-white transition-all`}>Subsystem-Oriented</span>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Projection Method</span>
                <span className={`${isFullScreen ? 'text-lg' : 'text-neon-cyan'} font-black text-neon-cyan transition-all`}>Manifold Learning (Simplified)</span>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Visualization Fidelity</span>
                <span className={`${isFullScreen ? 'text-lg' : 'text-neon-green'} font-black text-neon-green transition-all`}>High Resolution Heatmap</span>
            </div>
        </div>
    );

    const plotElement = (
        <Plot
            data={plotData as any}
            layout={{
                height: isFullScreen ? window.innerHeight * 0.7 : 600,
                autosize: true,
                margin: { t: 0, r: 0, l: 0, b: 0 },
                paper_bgcolor: 'rgba(0,0,0,0)',
                scene: {
                    xaxis: { visible: false },
                    yaxis: { visible: false },
                    zaxis: {
                        title: {
                            text: 'Flux Magnitude',
                            font: { color: '#94a3b8', size: isFullScreen ? 12 : 10 }
                        },
                        tickfont: { color: '#475569', size: isFullScreen ? 10 : 8 },
                        gridcolor: '#1e293b'
                    },
                    camera: {
                        eye: { x: 1.5, y: 1.5, z: 1.5 }
                    }
                },
                showlegend: true,
                legend: {
                    font: { color: '#94a3b8', size: isFullScreen ? 12 : 10 },
                    bgcolor: 'rgba(0,0,0,0)',
                    orientation: 'h',
                    y: -0.1
                }
            }}
            config={{ responsive: true, displayModeBar: true, scrollZoom: true }}
            className="w-full"
        />
    );

    if (isFullScreen) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-8 overflow-hidden transition-all">
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl" onClick={() => setIsFullScreen(false)} />
                <div className="relative w-full max-w-[1600px] h-full bg-slate-900/40 border border-white/10 rounded-[40px] p-12 flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                    <button
                        onClick={() => setIsFullScreen(false)}
                        className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all shadow-xl border border-white/10"
                    >
                        <X size={24} />
                    </button>
                    {headerContent}
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                        {plotElement}
                    </div>
                    {statsContent}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-900/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 mt-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
            {headerContent}
            {plotElement}
            {statsContent}
        </div>
    );
};

export default FluxSpace3D;
