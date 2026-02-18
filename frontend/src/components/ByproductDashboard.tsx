import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label
} from 'recharts';
import { Leaf, DollarSign, AlertTriangle, Recycle, ArrowRight, Zap } from 'lucide-react';

interface ByproductAnalysis {
    matrix_data: Array<{
        id: string;
        name: string;
        toxicity: number;
        price: number;
        toxicity_level: string;
        economic_level: string;
        value: number; // Production rate or concentration
    }>;
    suggestions: Array<{
        byproduct: string;
        method: string;
        description: string;
        potential_value: string;
        difficulty: string;
    }>;
    summary: {
        total_value: number;
        high_toxicity_count: number;
        eco_friendly_score: number;
    };
}

interface Props {
    data: ByproductAnalysis | null;
    loading: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3 rounded-xl shadow-2xl">
                <h4 className="font-bold text-neon-cyan mb-1">{data.name}</h4>
                <div className="text-xs space-y-1 text-slate-300">
                    <p><span className="text-slate-500">ID:</span> {data.id}</p>
                    <p><span className="text-slate-500">독성:</span> {data.toxicity.toFixed(2)} (Threshold: 1.0)</p>
                    <p><span className="text-slate-500">가치:</span> ${data.price.toFixed(2)}/kg</p>
                    <p><span className="text-slate-500">생성량:</span> {data.value.toFixed(4)} mmol/gDW/h</p>
                </div>
            </div>
        );
    }
    return null;
};

export const ByproductDashboard: React.FC<Props> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4 animate-pulse">
                <RefreshIcon />
                <p className="text-slate-500 font-medium">부산물 영향 평가 중...</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="h-full flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">

            {/* 1. Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <SummaryCard
                    title="친환경 점수 (Eco-Score)"
                    value={`${data.summary.eco_friendly_score.toFixed(0)}/100`}
                    icon={<Leaf className="w-5 h-5 text-green-400" />}
                    gradient="from-green-500/20 to-emerald-500/5"
                    borderColor="border-green-500/30"
                    subText={data.summary.eco_friendly_score > 70 ? "양호 (Sustainable)" : "주의 (Improvement Needed)"}
                />
                <SummaryCard
                    title="예상 경제적 가치"
                    value={`$${data.summary.total_value.toFixed(2)}`}
                    icon={<DollarSign className="w-5 h-5 text-amber-400" />}
                    gradient="from-amber-500/20 to-orange-500/5"
                    borderColor="border-amber-500/30"
                    subText="시간당 생산 가치 (Estimated)"
                />
                <SummaryCard
                    title="고독성 부산물"
                    value={`${data.summary.high_toxicity_count}종`}
                    icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
                    gradient="from-red-500/20 to-rose-500/5"
                    borderColor="border-red-500/30"
                    subText={data.summary.high_toxicity_count > 0 ? "세포 성장 저해 위험" : "안전 범위 내"}
                    alert={data.summary.high_toxicity_count > 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                {/* 2. Quadrant Chart (Toxicity vs Price) */}
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 flex flex-col relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <div className="flex justify-between items-center mb-4 z-10">
                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-purple-400" />
                            경제성 vs 독성 매트릭스
                        </h3>
                        <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-1 rounded text-xs">
                            X: 독성 (Toxicity) | Y: 가격 (Price)
                        </span>
                    </div>

                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                                <XAxis
                                    type="number"
                                    dataKey="toxicity"
                                    name="toxicity"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    label={{ value: '독성 (Toxicity)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 10 }}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="price"
                                    name="price"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    unit="$"
                                    label={{ value: '가격 (Price)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                                {/* Quadrant References */}
                                <ReferenceLine x={0.5} stroke="#cbd5e1" strokeDasharray="3 3" strokeOpacity={0.3} />
                                <ReferenceLine y={50} stroke="#cbd5e1" strokeDasharray="3 3" strokeOpacity={0.3} />

                                {/* Quadrant Labels */}
                                <ReferenceLine segment={[{ x: 0.1, y: 90 }, { x: 0.4, y: 90 }]} stroke="none" label="High Value / Low Tox" />

                                <Scatter name="Byproducts" data={data.matrix_data} fill="#8884d8">
                                    {data.matrix_data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.toxicity > 0.7 ? '#f43f5e' : entry.price > 50 ? '#10b981' : '#3b82f6'}
                                        />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Upcycling Suggestions */}
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4 z-10">
                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <Recycle className="w-4 h-4 text-green-400" />
                            업사이클링 전략 (AI Suggestion)
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        <AnimatePresence>
                            {data.suggestions.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/60 transition-colors group cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                                                {item.byproduct}
                                            </span>
                                            <ArrowRight className="w-3 h-3 text-slate-500" />
                                            <span className="font-bold text-green-400 text-sm">{item.method}</span>
                                        </div>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${item.difficulty === 'Easy' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                                                item.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>
                                            {item.difficulty}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed mb-2 group-hover:text-slate-300 transition-colors">
                                        {item.description}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <DollarSign className="w-3 h-3 text-amber-500" />
                                        <span className="text-xs text-amber-200 font-medium">예상 가치: {item.potential_value}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {data.suggestions.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                <p>업사이클링 추천 항목이 없습니다.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SummaryCard = ({ title, value, icon, gradient, borderColor, subText, alert = false }: any) => (
    <motion.div
        whileHover={{ y: -2 }}
        className={`relative overflow-hidden rounded-2xl border ${borderColor} bg-slate-900/40 backdrop-blur-md p-4 group`}
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
                <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">{title}</span>
                <div className={`p-1.5 rounded-lg bg-slate-800/50 ${alert ? 'animate-pulse' : ''}`}>
                    {icon}
                </div>
            </div>
            <div className="text-2xl font-black text-slate-100 tracking-tight mb-1">
                {value}
            </div>
            <p className={`text-[10px] font-medium ${alert ? 'text-red-400' : 'text-slate-500'}`}>
                {subText}
            </p>
        </div>
    </motion.div>
);

const RefreshIcon = () => (
    <svg className="animate-spin h-8 w-8 text-neon-cyan" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default ByproductDashboard;
