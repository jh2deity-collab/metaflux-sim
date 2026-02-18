"use client";

import React from 'react';
import { Settings, Zap, Trash2, Plus, Info, Search, MapPin } from 'lucide-react';

interface SidebarProps {
    modelId: string;
    config: {
        carbonSource: string;
        uptakeRate: number;
        aerobic: boolean;
    };
    setConfig: (config: any) => void;
    knockouts: string[];
    onAddKnockout: (gene: string) => void;
    onRemoveKnockout: (gene: string) => void;
    onSimulate: () => void;
    onSearch?: (term: string) => void;
    loading: boolean;
    simMethod: 'fba' | 'moma';
    setSimMethod: (method: 'fba' | 'moma') => void;
    omicsData: Record<string, number>;
    setOmicsData: (data: Record<string, number>) => void;
    onIntegrateOmics: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    modelId,
    config,
    setConfig,
    knockouts,
    onAddKnockout,
    onRemoveKnockout,
    onSimulate,
    onSearch,
    loading,
    simMethod,
    setSimMethod,
    omicsData,
    setOmicsData,
    onIntegrateOmics
}) => {
    return (
        <aside className="w-80 border-r border-slate-800 bg-slate-950/60 p-6 flex flex-col gap-6 overflow-y-auto backdrop-blur-xl scrollbar-hide">
            <div>
                <h2 className="text-neon-cyan text-[12px] font-black tracking-[0.2em] flex items-center gap-2 mb-6 opacity-100 uppercase">
                    <Settings size={14} /> 환경 변수 정밀 제어
                </h2>
                <div className="space-y-6">
                    <div className="group">
                        <label className="text-[13px] text-slate-100 font-black block mb-2 tracking-widest group-focus-within:text-neon-cyan transition-colors uppercase">주요 탄소원</label>
                        <select
                            className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl p-3 text-[13px] font-bold focus:border-neon-cyan outline-none transition-all appearance-none cursor-pointer hover:bg-slate-800 text-white"
                            value={config.carbonSource}
                            onChange={(e) => setConfig({ ...config, carbonSource: e.target.value })}
                        >
                            <option value="glc__D">포도당 (Glucose)</option>
                            <option value="glyc">글리세롤 (Glycerol)</option>
                            <option value="xyl__D">자일로스 (Xylose)</option>
                            <option value="succ">숙신산 (Succinate)</option>
                        </select>
                    </div>
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-[13px] text-slate-100 font-black tracking-widest uppercase">섭취 속도</label>
                            <span className="text-[13px] font-black font-mono text-neon-cyan">{config.uptakeRate}</span>
                        </div>
                        <input
                            type="range" min="-20" max="0" step="1"
                            className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-neon-cyan"
                            value={config.uptakeRate}
                            onChange={(e) => setConfig({ ...config, uptakeRate: parseInt(e.target.value) })}
                        />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <label className="text-[13px] text-slate-100 font-black tracking-widest uppercase">산소 공급</label>
                        <button
                            onClick={() => setConfig({ ...config, aerobic: !config.aerobic })}
                            className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all border ${config.aerobic
                                ? 'bg-neon-green/10 text-neon-green border-neon-green/30'
                                : 'bg-slate-800 text-slate-200 border-slate-700'
                                }`}
                        >
                            {config.aerobic ? '호기성' : '혐기성'}
                        </button>
                    </div>

                    <div className="pt-4 border-t border-slate-800/50 mt-4">
                        <label className="text-[13px] text-neon-cyan font-black block mb-3 tracking-[0.15em] uppercase">물질 위치 검색</label>
                        <div className="relative">
                            <input
                                id="metabolite-search"
                                className="w-full bg-slate-900 border border-slate-700/50 rounded-xl p-3 pr-12 text-[13px] font-bold focus:border-neon-cyan outline-none transition-all placeholder:text-slate-500 text-white"
                                placeholder="예: glc__D"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && onSearch) {
                                        onSearch(e.currentTarget.value);
                                    }
                                }}
                            />
                            <button
                                onClick={() => {
                                    const input = document.getElementById('metabolite-search') as HTMLInputElement;
                                    if (onSearch && input) onSearch(input.value);
                                }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-neon-cyan text-slate-950 rounded-lg hover:scale-105 transition-all"
                            >
                                <MapPin size={14} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-neon-cyan text-[13px] font-black tracking-[0.2em] flex items-center gap-2 mb-6 opacity-100 uppercase">
                    <Zap size={14} /> 유전자 설계 및 편집
                </h2>
                <div className="space-y-4">
                    <input
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-bold focus:border-neon-cyan outline-none transition-all placeholder:text-slate-500 text-white"
                        placeholder="유전자/반응 ID 입력..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onAddKnockout(e.currentTarget.value);
                                e.currentTarget.value = '';
                            }
                        }}
                    />
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1 scrollbar-hide">
                        {knockouts.map(ko => (
                            <span key={ko} className="flex items-center gap-2 bg-neon-red/10 text-neon-red border border-neon-red/20 px-3 py-1.5 rounded-lg text-[13.5px] font-black hover:bg-neon-red/20 transition-all">
                                {ko} <Trash2 size={12} className="cursor-pointer opacity-70 hover:opacity-100" onClick={() => onRemoveKnockout(ko)} />
                            </span>
                        ))}
                        {knockouts.length === 0 && (
                            <div className="w-full py-6 border border-dashed border-slate-800 rounded-xl flex items-center justify-center bg-slate-900/20">
                                <p className="text-[11px] text-slate-400 font-black tracking-wider uppercase">수정 사항 없음</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80">
                <h2 className="text-neon-cyan text-[13px] font-black tracking-[0.2em] flex items-center gap-2 mb-4 opacity-100 uppercase bg-neon-cyan/5 -mx-6 px-6 py-2 border-y border-neon-cyan/10">
                    <Info size={14} /> 오믹스 데이터 통합 (Omics)
                </h2>
                <div className="space-y-3">
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 shadow-inner">
                        <div className="flex gap-2 mb-2">
                            <input
                                id="gene-id-input"
                                className="flex-1 bg-slate-950 border border-slate-700/50 rounded-lg p-2 text-[11px] font-mono text-neon-cyan outline-none focus:border-neon-cyan/50"
                                placeholder="Gene ID"
                            />
                            <input
                                id="gene-val-input"
                                type="number"
                                className="w-14 bg-slate-950 border border-slate-700/50 rounded-lg p-2 text-[11px] font-mono text-white outline-none focus:border-neon-cyan/50"
                                placeholder="Val"
                            />
                            <button
                                onClick={() => {
                                    const idInput = document.getElementById('gene-id-input') as HTMLInputElement;
                                    const valInput = document.getElementById('gene-val-input') as HTMLInputElement;
                                    if (idInput.value && valInput.value) {
                                        setOmicsData({ ...omicsData, [idInput.value]: parseFloat(valInput.value) });
                                        idInput.value = '';
                                        valInput.value = '';
                                    }
                                }}
                                className="p-1.5 bg-neon-cyan text-slate-950 rounded-lg hover:scale-105 transition-transform"
                            >
                                <Plus size={12} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="max-h-24 overflow-y-auto space-y-1 pr-1 scrollbar-hide">
                            {Object.entries(omicsData).map(([id, val]) => (
                                <div key={id} className="flex justify-between items-center bg-slate-950/30 px-2 py-1 rounded border border-slate-800/20">
                                    <span className="text-[10px] font-mono text-slate-300">{id}</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-black text-neon-cyan">{val}</span>
                                        <Trash2
                                            size={10}
                                            className="text-slate-600 hover:text-red-400 cursor-pointer"
                                            onClick={() => {
                                                const newData = { ...omicsData };
                                                delete newData[id];
                                                setOmicsData(newData);
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={onIntegrateOmics}
                        disabled={loading || Object.keys(omicsData).length === 0}
                        className="w-full py-2.5 bg-neon-cyan hover:bg-neon-cyan/80 text-slate-950 rounded-lg text-[11px] font-black tracking-widest uppercase transition-all disabled:opacity-30 disabled:bg-slate-800 disabled:text-slate-500 shadow-lg shadow-neon-cyan/10"
                    >
                        오믹스 데이터 투영 (Mapping)
                    </button>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-800/50">
                <h2 className="text-[13px] text-slate-100 font-black mb-4 tracking-widest uppercase">분석 알고리즘</h2>
                <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800/50">
                    <button
                        onClick={() => setSimMethod('fba')}
                        className={`flex-1 py-1.5 text-[10px] font-black tracking-wider uppercase rounded-lg transition-all ${simMethod === 'fba' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white'}`}
                    >
                        FBA
                    </button>
                    <button
                        onClick={() => setSimMethod('moma')}
                        className={`flex-1 py-1.5 text-[10px] font-black tracking-wider uppercase rounded-lg transition-all ${simMethod === 'moma' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white'}`}
                    >
                        MOMA
                    </button>
                </div>
            </div>

            <button
                onClick={onSimulate}
                disabled={loading}
                className="mt-auto w-full group relative overflow-hidden bg-white hover:bg-neon-cyan disabled:bg-slate-800 text-slate-950 font-black text-sm py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 shadow-xl disabled:shadow-none"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {loading ? (
                    <span className="flex items-center gap-3">
                        <div className="w-5 h-5 border-3 border-slate-950 border-t-transparent animate-spin rounded-full" />
                        분석 연산 중...
                    </span>
                ) : (
                    <>데이터 전송 및 연산 실행</>
                )}
            </button>
        </aside>
    );
};

export default Sidebar;
