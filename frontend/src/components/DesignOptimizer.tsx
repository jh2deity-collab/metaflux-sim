"use client";

import React, { useState } from 'react';
import { Target, Cpu, FlaskConical, ChevronRight, CheckCircle2, TrendingUp, Search, BrainCircuit } from 'lucide-react';
import axios from 'axios';
import XAIExplainer from './XAIExplainer';

interface DesignOptimizerProps {
    modelId: string;
    onApplyKnockouts: (genes: string[]) => void;
    setNotification: (notif: { message: string, type: 'success' | 'info' | 'error' }) => void;
}

const DesignOptimizer: React.FC<DesignOptimizerProps> = ({ modelId, onApplyKnockouts, setNotification }) => {
    const [targetRxn, setTargetRxn] = useState('');
    const [maxKnockouts, setMaxKnockouts] = useState(2);
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);

    // XAI Modal State
    const [xaiData, setXaiData] = useState<{ isOpen: boolean; strategyName: string; rationale: any }>({
        isOpen: false,
        strategyName: '',
        rationale: null
    });

    const handleOptimize = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/optimize-design', {
                model_id: modelId,
                target_rxn_id: targetRxn,
                max_knockouts: maxKnockouts,
                min_growth: 0.1
            });
            if (response.data.success) {
                setSuggestions(response.data.strategies);
                setNotification({ message: "타겟 반응에 대한 지능형 유전자 변형 시나리오가 도출되었습니다.", type: 'success' });
                // Trigger production envelope analysis as well
                if (typeof (window as any).triggerEnvelopeAnalysis === 'function') {
                    (window as any).triggerEnvelopeAnalysis(targetRxn);
                }
            } else {
                setNotification({ message: `설계 분석 실패: ${response.data.error}`, type: 'error' });
            }
        } catch (error) {
            console.error("Design optimization failed", error);
            setNotification({ message: "자동 설계 엔진 연산 중 오류가 발생했습니다.", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 mt-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <Cpu size={200} className="text-neon-cyan" />
            </div>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-3">
                        <Target className="text-neon-cyan animate-pulse" size={24} />
                        AI 유전적 개량 자동 설계 (Design Automation)
                    </h3>
                    <p className="text-sm text-slate-400 mt-2 font-medium">
                        최적의 생산 수율을 위한 유전자 제거 조합을 알고리즘이 자동으로 제안합니다.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="group">
                        <label className="text-[13px] text-slate-100 font-black block mb-3 tracking-widest uppercase">생산 극대화 타겟 반응 (Target Reaction ID)</label>
                        <div className="relative">
                            <input
                                value={targetRxn}
                                onChange={(e) => setTargetRxn(e.target.value)}
                                className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl p-4 pl-12 text-sm font-mono text-neon-cyan outline-none focus:border-neon-cyan transition-all"
                                placeholder="예: EX_succ_e or D_LACt2..."
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                        </div>
                    </div>

                    <div className="group">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-[13px] text-slate-100 font-black tracking-widest uppercase">최대 Knockout 개수 (Max K-number)</label>
                            <span className="text-[13.5px] font-black font-mono text-neon-cyan">{maxKnockouts}</span>
                        </div>
                        <input
                            type="range" min="1" max="5" step="1"
                            value={maxKnockouts}
                            onChange={(e) => setMaxKnockouts(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-neon-cyan"
                        />
                    </div>

                    <button
                        onClick={handleOptimize}
                        disabled={loading || !targetRxn}
                        className="w-full py-4 bg-white hover:bg-neon-cyan text-slate-950 font-black rounded-xl transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-30"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-3 border-slate-950 border-t-transparent animate-spin rounded-full" />
                        ) : (
                            <>최적 설계 알고리즘 가동</>
                        )}
                    </button>
                </div>

                <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[13px] text-slate-400 font-black tracking-widest uppercase">알고리즘 추천 설계도 (Suggested Strategies)</h4>
                        {suggestions.length > 0 && (
                            <span className="text-[11px] text-neon-cyan font-bold bg-neon-cyan/5 px-2 py-0.5 rounded border border-neon-cyan/20 animate-pulse">
                                Engine: Branch Point Analysis
                            </span>
                        )}
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2 scrollbar-hide">
                        {suggestions.length > 0 ? (
                            suggestions.map((s, idx) => (
                                <div key={idx} className="bg-slate-900 border border-slate-800/50 rounded-xl p-4 hover:border-neon-cyan/50 transition-colors group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-wrap gap-2">
                                            {s.knockouts.map((ko: string) => (
                                                <span key={ko} className="px-2 py-1 bg-neon-red/10 text-neon-red text-[11px] font-black rounded border border-neon-red/20">{ko}</span>
                                            ))}
                                        </div>
                                        <span className="text-[11px] font-black text-neon-cyan bg-neon-cyan/10 px-2 py-1 rounded">Score: {s.score}</span>
                                    </div>
                                    <div className="flex justify-between text-[12px] font-bold">
                                        <span className="text-slate-300">예상 성장: <span className="text-white">{s.expected_growth.toFixed(3)}</span></span>
                                        <span className="text-slate-300">예상 생산: <span className="text-neon-cyan">{s.expected_production.toFixed(2)}</span></span>
                                    </div>
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700/50">
                                        <button
                                            onClick={() => onApplyKnockouts(s.knockouts)}
                                            className="flex-1 py-2.5 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan text-xs font-black rounded-lg transition-colors border border-neon-cyan/30 uppercase tracking-wider"
                                        >
                                            전략 적용 (Apply)
                                        </button>
                                        <button
                                            onClick={() => setXaiData({
                                                isOpen: true,
                                                strategyName: `Strategy #${idx + 1}`,
                                                rationale: s.rationale
                                            })}
                                            className="px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-black rounded-lg transition-colors border border-indigo-500/30 flex items-center gap-2"
                                            title="AI 추론 근거 보기"
                                        >
                                            <BrainCircuit size={14} /> Analyze
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 opacity-50">
                                <Cpu size={48} />
                                <p className="text-sm font-bold">최적화 설계를 실행하여 AI의 제안을 확인하세요.</p>
                            </div>
                        )}
                    </div>

                    {suggestions.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-800/50">
                            <div className="flex items-center gap-2 text-neon-green">
                                <CheckCircle2 size={14} />
                                <span className="text-[11px] font-black uppercase tracking-tighter">분기점 분석 기반 최적 해법 도출 완료</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DesignOptimizer;
