"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import EscherMap from '@/components/EscherMap';
import ResultDashboard from '@/components/ResultDashboard';
import DynamicChart from '@/components/DynamicChart';
import AIAssistant from './AIAssistant';
import ReportTemplate from './ReportTemplate';
import FVAChart from './FVAChart';
import OmicsAnalysisChart from './OmicsAnalysisChart';
import DesignOptimizer from './DesignOptimizer';
import FluxSpace3D from './FluxSpace3D';
import WorkspaceManager from './WorkspaceManager';
import ProductionEnvelopeChart from './ProductionEnvelopeChart';
import ProcessingStatus from './ProcessingStatus';
import PremiumModal from './PremiumModal';
import SimulationTimeline from './SimulationTimeline';
import ByproductDashboard from './ByproductDashboard';
import axios from 'axios';
import { Microscope, ArrowLeft, Play, Timer, Database, FileDown, Loader2, Zap, Layers, CheckCircle2, XCircle, Info, X, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function DashboardPage({ modelId, onBack }: { modelId: string, onBack: () => void }) {
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({
        carbonSource: 'glc__D',
        uptakeRate: -10,
        aerobic: true
    });
    const [knockouts, setKnockouts] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<{
        growthRate: number;
        fluxes: Record<string, number>;
        byproducts: Array<{ id: string; value: number }>;
        carbonLossIndex?: number;
        shadowPrices?: Record<string, number>;
        byproduct_analysis?: any;
    } | null>(null);
    const [baselineResults, setBaselineResults] = useState<{
        growthRate: number;
        fluxes: Record<string, number>;
        byproducts: Array<{ id: string; value: number }>;
    } | null>(null);
    const [selectedItem, setSelectedItem] = useState<{ id: string, type: 'metabolite' | 'reaction' } | null>(null);
    const [simMethod, setSimMethod] = useState<'fba' | 'moma'>('fba');
    const [fvaResults, setFvaResults] = useState<any>(null);
    const [isFvaLoading, setIsFvaLoading] = useState(false);
    const [omicsData, setOmicsData] = useState<Record<string, number>>({});

    // Report State
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [lastAISummary, setLastAISummary] = useState('');
    const [mapSnapshot, setMapSnapshot] = useState<string | undefined>(undefined);

    // Dynamic Simulation State
    const [simMode, setSimMode] = useState<'static' | 'dynamic'>('static');
    const [serverStatus, setServerStatus] = useState<boolean>(false);
    const [dynamicParams, setDynamicParams] = useState({
        initialGlucose: 20,
        initialBiomass: 0.01,
        totalTime: 24
    });
    const [dynamicResults, setDynamicResults] = useState<any>(null);
    const [projection3D, setProjection3D] = useState<any[]>([]);

    // Timeline Logic State
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 5x, 10x
    const [currentFluxes, setCurrentFluxes] = useState<Record<string, number> | null>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics'>('dashboard');

    const [mapSize, setMapSize] = useState<'min' | 'mid' | 'max'>('mid');
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'info' | 'success' | 'warning' | 'danger';
        onConfirm?: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });
    const [envelopeData, setEnvelopeData] = useState<any>(null);

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Check server health on mount
    useEffect(() => {
        const checkHealth = async () => {
            try {
                await axios.get('http://localhost:8000/health');
                setServerStatus(true);
                console.log("Backend server is reachable.");
            } catch (error) {
                console.error("Backend server is unreachable:", error);
                setServerStatus(false);
                setNotification({ message: "서버 연결 실패. 백엔드가 실행 중인지 확인해주세요.", type: 'error' });
            }
        };
        checkHealth();
    }, []);

    const handleSimulate = async () => {
        setLoading(true);
        try {
            if (simMode === 'static') {
                const response = await axios.post('http://localhost:8000/simulate', {
                    model_id: modelId,
                    carbon_source: config.carbonSource,
                    uptake_rate: config.uptakeRate,
                    aerobic: config.aerobic,
                    knockouts: knockouts
                });
                // Map snake_case from backend to camelCase for frontend
                const data = response.data;
                setResults({
                    growthRate: data.growth_rate,
                    fluxes: data.fluxes,
                    byproducts: data.byproducts
                });
            } else {
                try {
                    const response = await axios.post('http://localhost:8000/simulate-dynamic', {
                        model_id: modelId,
                        initial_glucose: dynamicParams.initialGlucose,
                        initial_biomass: dynamicParams.initialBiomass,
                        total_time: dynamicParams.totalTime,
                        time_step: 1.0,
                        knockouts: knockouts,
                        include_flux_history: true
                    }, { timeout: 60000 }); // 60s timeout for first try

                    const data = response.data;
                    processDynamicResults(data);
                } catch (firstError) {
                    console.warn("First simulation attempt failed, retrying without flux history...", firstError);
                    setNotification({ message: "고해상도 데이터 수신 실패. 일반 모드로 재시도합니다...", type: 'info' });

                    // Retry logic: Disable heavy data transfer
                    try {
                        const retryResponse = await axios.post('http://localhost:8000/simulate-dynamic', {
                            model_id: modelId,
                            initial_glucose: dynamicParams.initialGlucose,
                            initial_biomass: dynamicParams.initialBiomass,
                            total_time: dynamicParams.totalTime,
                            time_step: 1.0,
                            knockouts: knockouts,
                            include_flux_history: false // Disable heavy payload
                        }, { timeout: 60000 });

                        processDynamicResults(retryResponse.data);
                        setNotification({ message: "시뮬레이션 완료 (데이터 최적화 모드)", type: 'success' });
                    } catch (retryError: any) {
                        console.error("Simulation failed", retryError);
                        const errorMsg = retryError.response?.data?.detail || retryError.message || "Unknown Error";
                        setNotification({ message: `시뮬레이션 실패: ${errorMsg}`, type: 'error' });
                        throw retryError; // Propagate to outer catch
                    }
                }

                function processDynamicResults(data: any) {
                    setDynamicResults({
                        time: data.time,
                        biomass: data.biomass,
                        glucose: data.glucose,
                        growthRates: data.growth_rates,
                        byproducts: data.byproducts,
                        flux_history: data.flux_history || [],
                        toxicity_alerts: data.toxicity_alerts
                    });

                    if (data.toxicity_alerts && data.toxicity_alerts.length > 0) {
                        setNotification({
                            message: `[경고] ${data.toxicity_alerts[0].byproduct} 농도가 임계치에 도달하여 성장이 저해되고 있습니다!`,
                            type: 'error'
                        });
                    }

                    // Initialize timeline
                    setCurrentTime(0);
                    setIsPlaying(true);
                }
            }
        } catch (error) {
            console.error("Simulation failed", error);
            setModalConfig({
                isOpen: true,
                title: "시뮬레이션 오류",
                message: "연산 처리 중 예상치 못한 기술적 장애가 발생했습니다. 백엔드 엔진 상태를 확인해 주세요.",
                type: 'danger'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSetBaseline = () => {
        if (results) {
            setBaselineResults(results);
        }
    };

    const handleClearBaseline = () => {
        setBaselineResults(null);
    };

    const handleRunFVA = async () => {
        setIsFvaLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/simulate-fva', {
                model_id: modelId,
                carbon_source: config.carbonSource,
                uptake_rate: config.uptakeRate,
                aerobic: config.aerobic,
                knockouts: knockouts,
                fraction_of_optimum: 0.95
            });
            if (response.data.success) {
                setFvaResults(response.data.fva_results);
                setNotification({ message: "지능형 가변성 분석(FVA)이 완료되었습니다.", type: 'success' });
            } else {
                setNotification({ message: `FVA 분석 실패: ${response.data.error}`, type: 'error' });
            }
        } catch (error) {
            console.error("FVA Analysis failed", error);
            alert("FVA 분석 중 오류가 발생했습니다.");
        } finally {
            setIsFvaLoading(false);
        }
    };

    const handleIntegrateOmics = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/integrate-omics', {
                model_id: modelId,
                gene_expression: omicsData,
                normalization_factor: 1.0
            });

            const data = response.data;
            if (data.growth_rate !== undefined) {
                setResults({
                    growthRate: data.growth_rate,
                    fluxes: data.fluxes,
                    byproducts: data.byproducts
                });
                alert(data.message);
            }
        } catch (error) {
            console.error("Omics Integration failed", error);
            setModalConfig({
                isOpen: true,
                title: "데이터 통합 실패",
                message: "오믹스 프로파일 투영 중 오류가 발생했습니다. 데이터의 정규화 상태를 확인해 주세요.",
                type: 'warning'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRun3DAnalysis = async () => {
        if (!results?.fluxes) return;
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/analyze-3d-space', {
                model_id: modelId,
                fluxes: results.fluxes
            });
            if (response.data.success) {
                setProjection3D(response.data.projections);
            }
        } catch (error) {
            console.error("3D Analysis failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveWorkspace = () => {
        const workspaceData = {
            config,
            knockouts,
            omicsData,
            simMethod,
            timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(workspaceData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MetaFlux_Project_${modelId}_${new Date().getTime()}.json`;
        a.click();
        setNotification({ message: "연구 워크스페이스(.mflux)가 성공적으로 보존되었습니다.", type: 'success' });
    };

    const handleLoadWorkspace = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (re) => {
                try {
                    const data = JSON.parse(re.target?.result as string);
                    if (data.config) setConfig(data.config);
                    if (data.knockouts) setKnockouts(data.knockouts);
                    if (data.omicsData) setOmicsData(data.omicsData);
                    if (data.simMethod) setSimMethod(data.simMethod);
                    setNotification({ message: "보존된 워크스페이스를 성공적으로 복구했습니다.", type: 'success' });
                } catch (err) {
                    setModalConfig({
                        isOpen: true,
                        title: "파일 형식 오류",
                        message: "읽어들인 .json 데이터의 구조가 MetaFlux 통신 규격과 일치하지 않습니다.",
                        type: 'danger'
                    });
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleResetWorkspace = () => {
        setModalConfig({
            isOpen: true,
            title: "연구 환경 초기화",
            message: "현재 설정된 모든 실험 변수와 노크아웃 데이터를 리셋하시겠습니까? (기준 데이터는 보존됩니다)",
            type: 'warning',
            onConfirm: () => {
                setKnockouts([]);
                setOmicsData({});
                setResults(null);
                setProjection3D([]);
                setNotification({ message: "워크스페이스가 최기화되었습니다.", type: 'info' });
            }
        });
    };

    const handleFetchEnvelope = async (targetRxn: string) => {
        try {
            const response = await axios.post('http://localhost:8000/production-envelope', {
                model_id: modelId,
                target_rxn_id: targetRxn,
                carbon_source: config.carbonSource,
                uptake_rate: config.uptakeRate,
                aerobic: config.aerobic,
                knockouts: knockouts
            });
            if (response.data.success) {
                setEnvelopeData(response.data);
                setNotification({ message: `타겟 반응(${targetRxn})에 대한 생산 포괄도 분석이 완료되었습니다.`, type: 'info' });
            }
        } catch (error) {
            console.error("Failed to fetch production envelope", error);
        }
    };

    useEffect(() => {
        (window as any).triggerEnvelopeAnalysis = handleFetchEnvelope;
        return () => { delete (window as any).triggerEnvelopeAnalysis; };
    }, [handleFetchEnvelope]);

    // Timeline Playback Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && dynamicResults) {
            interval = setInterval(() => {
                setCurrentTime(prev => {
                    const nextTime = prev + (0.5 * playbackSpeed); // Base step 0.5h
                    if (nextTime >= dynamicParams.totalTime) {
                        setIsPlaying(false);
                        return dynamicParams.totalTime;
                    }
                    return nextTime;
                });
            }, 500); // Update every 500ms
        }
        return () => clearInterval(interval);
    }, [isPlaying, playbackSpeed, dynamicResults, dynamicParams.totalTime]);

    // Update Visualization based on Current Time
    useEffect(() => {
        if (dynamicResults && dynamicResults.flux_history) {
            // Find index closest to current time
            const timeIndex = dynamicResults.time.findIndex((t: number) => t >= currentTime);
            const verifiedIndex = timeIndex === -1 ? dynamicResults.time.length - 1 : timeIndex;

            if (dynamicResults.flux_history[verifiedIndex]) {
                const snapshot = dynamicResults.flux_history[verifiedIndex];
                setCurrentFluxes(snapshot);

                // Also update key metrics for ResultDashboard if needed
                // For now, we update the results state to reflect the specific time slice
                // This makes the whole dashboard "time-travel"
                if (simMode === 'dynamic') {
                    setResults({
                        growthRate: dynamicResults.growth_rates[verifiedIndex] || 0,
                        fluxes: snapshot,
                        byproducts: Object.keys(dynamicResults.byproducts).map(bid => ({
                            id: bid,
                            value: dynamicResults.byproducts[bid][verifiedIndex] || 0
                        }))
                    });
                }
            }
        }
    }, [currentTime, dynamicResults, simMode]);

    const handleSpeedChange = () => {
        const speeds = [1, 2, 5, 10];
        const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
        setPlaybackSpeed(speeds[nextIdx]);
    };

    const handleDownloadReport = async () => {
        setIsGeneratingReport(true);
        try {
            // Helper to sanitize styles for html2canvas
            const sanitizeOptions = {
                useCORS: true,
                scale: 2,
                logging: false,
                onclone: (clonedDoc: Document) => {
                    const styleTags = clonedDoc.getElementsByTagName('style');
                    for (let i = 0; i < styleTags.length; i++) {
                        const tag = styleTags[i];
                        if (tag.innerHTML.includes('lab(') || tag.innerHTML.includes('oklch(')) {
                            tag.innerHTML = tag.innerHTML.replace(/lab\([^)]+\)/g, '#334155');
                            tag.innerHTML = tag.innerHTML.replace(/oklch\([^)]+\)/g, '#334155');
                        }
                    }
                }
            };

            // 1. Capture Escher Map Snapshot first
            const mapElement = document.querySelector('.escher-container');
            if (mapElement) {
                const mapCanvas = await html2canvas(mapElement as HTMLElement, {
                    ...sanitizeOptions,
                    backgroundColor: '#020617'
                });
                setMapSnapshot(mapCanvas.toDataURL('image/png'));
            }

            // 2. If no AI summary, get a comprehensive one first
            let summary = lastAISummary;
            if (!summary && results) {
                try {
                    const aiResponse = await axios.post('http://localhost:8000/chat', {
                        message: "이 시뮬레이션 결과에 대해 핵심적인 전문가 분석 리포트를 작성해줘. 대사 경로 병목, 수율, 엔지니어링 전략을 포함하여 3~4페이지 분량의 고도로 압축된 문서로 구성해줘. 불필요한 서론을 줄이고 데이터와 인사이트 위주로 작성해. 각 섹션은 ## 로 구분해줘.",
                        model_id: modelId,
                        context: { current: results, baseline: baselineResults, fva: fvaResults }
                    });
                    summary = aiResponse.data.response;
                    setLastAISummary(summary);
                } catch (e) {
                    console.error("AI Analysis failed for report", e);
                }
            }

            // Wait a bit to ensure state update for snapshot is reflected in DOM
            await new Promise(resolve => setTimeout(resolve, 800));

            const reportContainer = document.getElementById('report-container');
            if (!reportContainer) throw new Error("Report container not found");

            // Temporary show container
            reportContainer.style.position = 'static';
            reportContainer.style.visibility = 'visible';

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageIds = Array.from({ length: 4 }, (_, i) => `report-page-${i + 1}`);
            for (let i = 0; i < pageIds.length; i++) {
                const pageElement = document.getElementById(pageIds[i]);
                if (!pageElement) continue;

                const canvas = await html2canvas(pageElement, {
                    ...sanitizeOptions,
                    backgroundColor: '#ffffff',
                    windowWidth: 800,
                });

                const imgData = canvas.toDataURL('image/png');
                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            }

            pdf.save(`MetaFlux_Expert_Analysis_${modelId}_${new Date().getTime()}.pdf`);

            // Restore hidden state
            reportContainer.style.position = 'absolute';
            reportContainer.style.visibility = 'hidden';

        } catch (error: any) {
            console.error("Multi-page Report generation failed", error);
            setModalConfig({
                isOpen: true,
                title: "리포트 생성 실패",
                message: `지능형 리포트를 렌더링하는 중 기술적 한계가 발생했습니다: ${error.message}`,
                type: 'danger'
            });
        } finally {
            setIsGeneratingReport(false);
        }
    };

    return (
        <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
            {loading && <ProcessingStatus />}
            <Sidebar
                modelId={modelId}
                config={config}
                setConfig={setConfig}
                knockouts={knockouts}
                onAddKnockout={(gene) => setKnockouts([...knockouts, gene])}
                onRemoveKnockout={(gene) => setKnockouts(knockouts.filter(k => k !== gene))}
                onSimulate={handleSimulate}
                loading={loading}
                onSearch={(term) => setSearchTerm(term)}
                simMethod={simMethod}
                setSimMethod={setSimMethod}
                omicsData={omicsData}
                setOmicsData={setOmicsData}
                onIntegrateOmics={handleIntegrateOmics}
            />

            <main className="flex-1 flex flex-col p-4 overflow-hidden">
                <header className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-5">
                        <div>
                            <h1
                                onClick={(e) => {
                                    if (e && typeof e.stopPropagation === 'function') {
                                        e.stopPropagation();
                                    }
                                    onBack();
                                }}
                                className="text-2xl font-black flex items-center gap-3 tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                <Microscope className="text-neon-cyan animate-pulse" /> METAFLUX-SIM
                            </h1>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="text-[14px] text-slate-400 tracking-widest uppercase font-bold whitespace-nowrap">대사 분석 엔진 가동 중</span>
                                <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full shadow-inner">
                                    <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                    <span className="text-[14px] text-neon-cyan font-black uppercase tracking-wider whitespace-nowrap">모델: {modelId === 'iML1515' ? '대장균' : '효모'} (Genome-scale)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <WorkspaceManager
                        onSave={handleSaveWorkspace}
                        onLoad={handleLoadWorkspace}
                        onReset={handleResetWorkspace}
                    />

                    <div className="flex items-center gap-4">
                        {results && (
                            <div className="flex gap-2">
                                {!baselineResults ? (
                                    <button
                                        onClick={handleSetBaseline}
                                        className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded-xl text-[12px] font-black tracking-widest uppercase transition-all"
                                    >
                                        기준으로 설정 (Set Baseline)
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleClearBaseline}
                                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded-xl text-[12px] font-black tracking-widest uppercase transition-all"
                                    >
                                        비교 모드 해제
                                    </button>
                                )}
                            </div>
                        )}
                        <button
                            onClick={handleDownloadReport}
                            disabled={isGeneratingReport || (!results && !dynamicResults)}
                            className="flex items-center gap-3 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl border border-blue-400/30 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group mr-2"
                        >
                            {isGeneratingReport ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <FileDown size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                            )}
                            <span className="text-[13px] font-black tracking-widest uppercase">리포트 생성 (PDF)</span>
                        </button>
                        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/50">
                            <button
                                onClick={() => setSimMode('static')}
                                className={`px-4 py-2 rounded-lg text-[12px] font-black uppercase tracking-widest transition-all ${simMode === 'static' ? 'bg-neon-cyan text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'text-slate-300 hover:text-white'}`}
                            >
                                정적 분석 (Static)
                            </button>
                            <button
                                onClick={() => setSimMode('dynamic')}
                                className={`px-4 py-2 rounded-lg text-[12px] font-black uppercase tracking-widest transition-all ${simMode === 'dynamic' ? 'bg-neon-green text-slate-950 shadow-[0_0_15px_rgba(74,222,128,0.4)]' : 'text-slate-300 hover:text-white'}`}
                            >
                                동역학 모드 (Dynamic)
                            </button>
                        </div>

                        {simMode === 'dynamic' && (
                            <div className="flex items-center gap-4 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800/50">
                                <div className="flex items-center gap-2">
                                    <Timer size={14} className="text-slate-400" />
                                    <input
                                        type="number"
                                        value={dynamicParams.totalTime}
                                        onChange={(e) => setDynamicParams({ ...dynamicParams, totalTime: Number(e.target.value) })}
                                        className="bg-transparent border-none text-[13px] font-black text-neon-green w-10 focus:ring-0"
                                    />
                                    <span className="text-[11px] text-slate-400 font-bold">h</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Database size={14} className="text-slate-400" />
                                    <input
                                        type="number"
                                        value={dynamicParams.initialGlucose}
                                        onChange={(e) => setDynamicParams({ ...dynamicParams, initialGlucose: Number(e.target.value) })}
                                        className="bg-transparent border-none text-[13px] font-black text-neon-cyan w-10 focus:ring-0"
                                    />
                                    <span className="text-[11px] text-slate-400 font-bold">g/L</span>
                                </div>
                                <button
                                    onClick={handleSimulate}
                                    disabled={loading}
                                    className="p-2 bg-neon-green/20 hover:bg-neon-green/40 text-neon-green rounded-lg transition-all disabled:opacity-50"
                                >
                                    <Play size={14} fill="currentColor" />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/50 rounded-2xl border border-slate-800/50 backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
                            </span>
                            <span className="text-[12px] font-black text-slate-300 tracking-widest uppercase">서버 연결 상태: 최적 (Optimal)</span>
                        </div>
                    </div>
                </header >

                <div className="flex flex-1 gap-6 overflow-hidden">
                    <div className={`relative transition-all duration-500 ease-in-out ${mapSize === 'min' ? 'flex-[2]' : mapSize === 'mid' ? 'flex-[5]' : 'flex-[12]'
                        }`}>
                        {/* Map Size Controls */}
                        <div className="absolute left-4 top-4 z-50 flex flex-col gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl">
                            <button
                                onClick={() => setMapSize('min')}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${mapSize === 'min' ? 'bg-neon-cyan text-slate-950' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                                title="최소 크기 (Min)"
                            >
                                <span className="text-[11px] font-black italic">MIN</span>
                            </button>
                            <button
                                onClick={() => setMapSize('mid')}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${mapSize === 'mid' ? 'bg-neon-cyan text-slate-950' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                                title="기본 크기 (Mid)"
                            >
                                <span className="text-[11px] font-black italic">MID</span>
                            </button>
                            <button
                                onClick={() => setMapSize('max')}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${mapSize === 'max' ? 'bg-neon-cyan text-slate-950' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                                title="최대 크기 (Max)"
                            >
                                <span className="text-[11px] font-black italic">MAX</span>
                            </button>
                        </div>

                        <EscherMap
                            modelId={modelId}
                            fluxData={results?.fluxes}
                            baselineFluxData={baselineResults?.fluxes}
                            highlightTerm={searchTerm}
                            activeCarbonSource={config.carbonSource}
                            knockouts={knockouts}
                            selectedItem={selectedItem}
                            mapSize={mapSize}
                            onKnockout={(id: string) => {
                                if (!knockouts.includes(id)) {
                                    setKnockouts([...knockouts, id]);
                                }
                            }}
                        />
                    </div>
                    {simMode === 'static' ? (
                        <div className="flex-1 min-w-0 space-y-6 overflow-y-auto max-h-full pb-20 scrollbar-hide">
                            <ResultDashboard
                                growthRate={results?.growthRate || 0}
                                byproducts={results?.byproducts || []}
                                carbonLossIndex={results?.carbonLossIndex}
                                shadowPrices={results?.shadowPrices}
                                fluxData={results?.fluxes}
                                baselineGrowthRate={baselineResults?.growthRate}
                                baselineByproducts={baselineResults?.byproducts}
                                onSelect={(item) => setSelectedItem(item)}
                            />

                            {results && (
                                <div className="mt-4">
                                    {!fvaResults ? (
                                        <button
                                            onClick={handleRunFVA}
                                            disabled={isFvaLoading}
                                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 border-2 border-dashed border-slate-700 rounded-2xl text-slate-400 text-xs font-black tracking-widest uppercase transition-all flex flex-col items-center justify-center gap-2 group"
                                        >
                                            {isFvaLoading ? (
                                                <Loader2 className="animate-spin text-neon-cyan" />
                                            ) : (
                                                <Zap className="group-hover:text-neon-cyan transition-colors" size={20} />
                                            )}
                                            <span>지능형 가변성 분석 (FVA) 실행</span>
                                        </button>
                                    ) : (
                                        <FVAChart data={fvaResults} />
                                    )}

                                    {Object.keys(omicsData).length > 0 && (
                                        <OmicsAnalysisChart
                                            omicsData={omicsData}
                                            fluxData={results?.fluxes}
                                        />
                                    )}

                                    <DesignOptimizer
                                        modelId={modelId}
                                        onApplyKnockouts={(suggested) => {
                                            const uniqueKnockouts = Array.from(new Set([...knockouts, ...suggested]));
                                            setKnockouts(uniqueKnockouts);
                                            setNotification({
                                                message: `${suggested.length}개의 맞춤 유전 설계가 모델에 정밀하게 반영되었습니다.`,
                                                type: 'success'
                                            });
                                        }}
                                        setNotification={setNotification}
                                    />

                                    {envelopeData && (
                                        <ProductionEnvelopeChart
                                            data={envelopeData.data}
                                            targetRxn={envelopeData.target_rxn}
                                        />
                                    )}

                                    {results && (
                                        <div className="mt-10">
                                            {projection3D.length === 0 ? (
                                                <button
                                                    onClick={handleRun3DAnalysis}
                                                    disabled={loading}
                                                    className="w-full py-8 bg-indigo-600/10 hover:bg-indigo-600/20 border-2 border-dashed border-indigo-500/30 rounded-3xl text-indigo-400 text-sm font-black tracking-widest uppercase transition-all flex flex-col items-center justify-center gap-4 group"
                                                >
                                                    <Layers className="group-hover:scale-110 transition-transform text-indigo-400" size={32} />
                                                    <span>FluxSpace 3D 다차원 분석 활성화</span>
                                                </button>
                                            ) : (
                                                <FluxSpace3D data={projection3D} />
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <DynamicChart data={dynamicResults} />
                    )}
                </div>

                {/* AI Assistant Integration */}
                <AIAssistant
                    modelId={modelId}
                    contextData={{
                        current: results,
                        baseline: baselineResults
                    }}
                    onLastMessage={(text) => setLastAISummary(text)}
                />

                {/* Container for report - accessible by DOM but hidden from view */}
                <div id="report-container" style={{ position: 'absolute', top: '-10000px', left: '-10000px', pointerEvents: 'none' }}>
                    <ReportTemplate
                        modelId={modelId}
                        config={config}
                        knockouts={knockouts}
                        results={results}
                        dynamicResults={dynamicResults}
                        fvaResults={fvaResults}
                        simMethod={simMethod}
                        omicsData={omicsData}
                        projection3D={projection3D}
                        aiSummary={lastAISummary}
                        mapSnapshot={mapSnapshot}
                    />
                </div>
                {/* Premium Modal System */}
                <PremiumModal
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    type={modalConfig.type}
                    onConfirm={modalConfig.onConfirm}
                />

                {/* Simulation Timeline (Dynamic Mode Only) */}
                {simMode === 'dynamic' && dynamicResults && (
                    <SimulationTimeline
                        totalTime={dynamicParams.totalTime}
                        currentTime={currentTime}
                        steps={dynamicResults.time.length}
                        isPlaying={isPlaying}
                        playbackSpeed={playbackSpeed}
                        onPlayPause={() => setIsPlaying(!isPlaying)}
                        onSeek={(t) => setCurrentTime(t)}
                        onSpeedChange={handleSpeedChange}
                        toxicityEvents={dynamicResults.toxicity_alerts}
                    />
                )}

                {/* Premium Notification Toast (Advanced) */}
                {notification && (
                    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[20001] animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <div className={`pl-4 pr-8 py-4 rounded-[24px] border backdrop-blur-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] flex items-center gap-5 transition-all
                            ${notification.type === 'success' ? 'bg-neon-green/10 border-neon-green/40 text-neon-green' :
                                notification.type === 'error' ? 'bg-rose-500/10 border-rose-500/40 text-rose-500' :
                                    'bg-neon-cyan/10 border-neon-cyan/40 text-neon-cyan'}`}>

                            <div className={`p-2.5 rounded-2xl ${notification.type === 'success' ? 'bg-neon-green/20' : notification.type === 'error' ? 'bg-rose-500/20' : 'bg-neon-cyan/20'}`}>
                                {notification.type === 'success' ? <CheckCircle2 size={24} /> :
                                    notification.type === 'error' ? <AlertCircle size={24} /> : <Info size={24} />}
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[14px] font-black tracking-tight uppercase mb-0.5">
                                    {notification.type === 'success' ? 'System Success' : notification.type === 'error' ? 'Security Alert' : 'System Info'}
                                </span>
                                <span className="text-[13px] font-bold text-slate-300 tracking-wide">
                                    {notification.message}
                                </span>
                            </div>

                            <button onClick={() => setNotification(null)} className="ml-6 p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </main >
        </div >
    );
}
