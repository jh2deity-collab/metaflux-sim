"use client";

import React, { useState } from 'react';
import DashboardPage from '@/components/Dashboard';

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  if (selectedModel) {
    return <DashboardPage modelId={selectedModel} onBack={() => setSelectedModel(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-cyan blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-green blur-[120px] rounded-full" />
      </div>

      <header className="mb-16 text-center relative">
        <div className="flex items-center justify-center gap-4 mb-5">
          <div className="w-16 h-1.5 bg-neon-cyan/60 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.3)]" />
          <h1 className="text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-neon-cyan to-white drop-shadow-2xl">
            METAFLUX-SIM
          </h1>
          <div className="w-16 h-1.5 bg-neon-green/60 rounded-full shadow-[0_0_15px_rgba(74,222,128,0.3)]" />
        </div>
        <p className="text-slate-200 tracking-[0.45em] uppercase text-sm font-bold opacity-90 drop-shadow-md">차세대 미생물 대사공학 시뮬레이션 플랫폼</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-6xl relative">
        <ModelCard
          title="대장균"
          subtitle="모델 사양: iML1515 (Genome-scale)"
          description="대사공학 및 바이오 테크놀로지 분야에서 가장 표준적으로 활용되는 강력한 대사 모델입니다."
          color="cyan"
          tag="대표 핵심 모델"
          onClick={() => setSelectedModel('iML1515')}
        />
        <ModelCard
          title="사카로미세스 (효모)"
          subtitle="모델 사양: iMM904 (Yeast Central)"
          description="고부가가치 화합물 생산 및 발효 공정 최적화에 특화된 진핵생물 대사 모델입니다."
          color="green"
          tag="발효 공정 최적화"
          onClick={() => setSelectedModel('iMM904')}
        />
      </div>

      <footer className="mt-24 text-[13px] text-slate-400 tracking-[0.2em] font-bold uppercase flex flex-col items-center gap-3">
        <div className="flex gap-6 items-center">
          <span className="hover:text-neon-cyan transition-colors">COBRApy 시뮬레이션 엔진</span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
          <span className="hover:text-neon-green transition-colors">Escher.js 데이터 시각화</span>
        </div>
        <p className="font-black text-slate-500 tracking-wider">Systems Biology Suite v1.0 • Engineered for Excellence</p>
      </footer>
    </div>
  );
}

function ModelCard({ title, subtitle, description, color, tag, onClick }: any) {
  const isCyan = color === 'cyan';
  const colorClass = isCyan
    ? 'border-neon-cyan/30 hover:border-neon-cyan shadow-neon-cyan/10'
    : 'border-neon-green/30 hover:border-neon-green shadow-neon-green/10';
  const textClass = isCyan ? 'text-neon-cyan' : 'text-neon-green';
  const bgClass = isCyan ? 'hover:bg-neon-cyan/10' : 'hover:bg-neon-green/10';

  return (
    <div
      onClick={onClick}
      className={`group bg-slate-900/40 backdrop-blur-2xl border p-12 rounded-[3rem] cursor-pointer transition-all duration-700 transform hover:-translate-y-4 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] ${colorClass} ${bgClass}`}
    >
      <div className="flex justify-between items-start mb-8">
        <span className={`text-[12px] font-black tracking-[0.25em] uppercase border-b-2 border-current pb-1 ${textClass}`}>{subtitle}</span>
        {tag && (
          <span className={`text-[11px] px-3 py-1 rounded-lg border-2 border-current font-black tracking-tight ${textClass}`}>
            {tag}
          </span>
        )}
      </div>
      <h3 className="text-4xl font-black mb-6 transition-all duration-300 group-hover:scale-[1.02] origin-left drop-shadow-lg">{title}</h3>
      <p className="text-slate-200 text-base leading-relaxed mb-12 h-14 font-medium opacity-80 group-hover:opacity-100 transition-opacity">{description}</p>
      <div className={`text-sm font-black uppercase flex items-center gap-4 transition-all duration-500 transform group-hover:translate-x-3 ${textClass}`}>
        분석 매개변수 설정 및 시뮬레이션 <span className="text-2xl">→</span>
      </div>
    </div>
  );
}
