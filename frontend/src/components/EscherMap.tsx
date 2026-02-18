"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

// escher will be loaded dynamically on the client
let escher: any = null;
if (typeof window !== 'undefined') {
    import('escher').then(mod => {
        escher = mod;
    });
}

interface EscherMapProps {
    modelId: string;
    fluxData?: Record<string, number>;
    baselineFluxData?: Record<string, number>;
    highlightTerm?: string;
    activeCarbonSource?: string;
    onKnockout?: (id: string) => void;
    knockouts?: string[];
    selectedItem?: { id: string, type: 'metabolite' | 'reaction' } | null;
    mapSize?: 'min' | 'mid' | 'max';
}

const EscherMap: React.FC<EscherMapProps> = ({
    modelId,
    fluxData,
    baselineFluxData,
    highlightTerm,
    activeCarbonSource,
    onKnockout,
    knockouts,
    selectedItem,
    mapSize = 'mid'
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const builderRef = useRef<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);

    // Context Menu State
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
    const [selectedRxn, setSelectedRxn] = useState<any>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const loadEscher = async () => {
            if (!escher) {
                const mod = await import('escher');
                escher = mod;
            }
            setIsLoaded(true);
        };

        loadEscher();
    }, []);

    useEffect(() => {
        if (!isLoaded || !containerRef.current || !escher) return;

        const mapUrl = modelId === 'iML1515'
            ? 'https://escher.github.io/1-0-0/maps/Escherichia%20coli/iJO1366.Central%20metabolism.json'
            : 'https://escher.github.io/1-0-0/maps/Saccharomyces%20cerevisiae/iMM904.Central%20carbon%20metabolism.json';

        const options = {
            menu: 'none',
            fill_screen: false,
            never_ask_before_quit: true,
            enable_editing: false,
            enable_search: false,
            reaction_data: fluxData,
            reaction_styles: ['color', 'size', 'abs', 'text'],
            reaction_compare_style: 'diff',
            canvas_size_and_loc: { x: 0, y: 0, width: 1200, height: 800 },
            scroll_behavior: 'zoom'
        };

        containerRef.current.innerHTML = '';
        let isMounted = true;

        fetch(mapUrl)
            .then(res => res.json())
            .then(data => {
                if (!isMounted || !containerRef.current) return;

                const builder = escher.Builder(data, null, null, containerRef.current, options);
                builderRef.current = builder;
                setIsMapReady(true);

                setTimeout(() => {
                    if (!isMounted || !containerRef.current) return;
                    try {
                        const svg = d3.select(containerRef.current).select('svg');

                        if (builder.map && builder.map.zoom_container && builder.map.zoom_container.filter) {
                            builder.map.zoom_container.filter(function (event: any) {
                                return !event.button || event.button === 1;
                            });
                        }

                        svg.selectAll('.reaction')
                            .style('cursor', 'pointer')
                            .on('click', (event: any, d: any) => {
                                if (d && d.bigg_id && onKnockout) {
                                    event.stopPropagation();
                                    onKnockout(d.bigg_id);
                                }
                            })
                            .on('contextmenu', (event: any, d: any) => {
                                if (d && d.bigg_id) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setMenuPos({ x: event.clientX, y: event.clientY });
                                    setSelectedRxn(d);
                                    setMenuVisible(true);
                                }
                            });

                        d3.select(window).on('click.menu-close', () => {
                            setMenuVisible(false);
                        });

                    } catch (e) {
                        console.warn('Post-load optimization info:', e);
                    }
                }, 100);
            })
            .catch(err => {
                console.error('Map loading pipeline failed:', err);
                if (containerRef.current) {
                    containerRef.current.innerHTML = `<div class="p-8 text-slate-500 text-sm font-black uppercase tracking-widest text-center">대사 지도를 불러올 수 없습니다.</div>`;
                }
            });

        return () => {
            isMounted = false;
        };
    }, [modelId, isLoaded]);

    // Flux Data Update (Comparison Mode Support)
    useEffect(() => {
        if (builderRef.current && isMapReady) {
            if (fluxData && baselineFluxData) {
                builderRef.current.set_reaction_data(fluxData, baselineFluxData);
            } else if (fluxData) {
                builderRef.current.set_reaction_data(fluxData);
            }
        }
    }, [fluxData, baselineFluxData, isMapReady]);

    // Search / Highlight
    useEffect(() => {
        if (!highlightTerm || !builderRef.current || !isMapReady) return;

        try {
            const builder = builderRef.current;
            if (!builder?.map?.nodes) return;

            const nodes = builder.map.nodes;
            const term = highlightTerm.toLowerCase().trim();

            if (term === '') return;

            const foundNodeId = Object.keys(nodes).find(id => {
                const node = nodes[id];
                if (node.node_type !== 'metabolite') return false;
                const biggId = (node.bigg_id || '').toLowerCase();
                const name = (node.name || '').toLowerCase();
                const label = (node.label || '').toLowerCase();
                return biggId.includes(term) || name.includes(term) || label.includes(term);
            });

            if (foundNodeId) {
                if (builder.map.zoom_container && typeof builder.map.zoom_container.go_to === 'function') {
                    const node = nodes[foundNodeId];
                    builder.map.zoom_container.go_to(0.8, [node.x, node.y]);
                }
                const hlData: Record<string, number> = {};
                if (nodes[foundNodeId].bigg_id) {
                    hlData[nodes[foundNodeId].bigg_id] = 100;
                    builder.set_metabolite_data(hlData);
                }
            }
        } catch (error) {
            console.error('Search Execution Error:', error);
        }
    }, [highlightTerm, isMapReady]);

    // Path Filtering (Visibility)
    useEffect(() => {
        if (!builderRef.current || !isMapReady || !containerRef.current) return;

        const svg = d3.select(containerRef.current).select('svg');
        if (fluxData) {
            const threshold = 1e-6;
            svg.selectAll('.reaction')
                .transition().duration(800)
                .style('opacity', (d: any) => {
                    if (!d || !d.bigg_id) return 1.0;
                    const flux = fluxData[d.bigg_id];
                    return (flux !== undefined && Math.abs(flux) > threshold) ? 1.0 : 0.05;
                });
            svg.selectAll('.reaction-label')
                .transition().duration(800)
                .style('opacity', (d: any) => {
                    if (!d || !d.bigg_id) return 1.0;
                    const flux = fluxData[d.bigg_id];
                    return (flux !== undefined && Math.abs(flux) > threshold) ? 1.0 : 0.05;
                });
        } else {
            svg.selectAll('.reaction, .reaction-label').style('opacity', 1.0);
        }
    }, [fluxData, isMapReady]);

    // Selected Item Focus
    useEffect(() => {
        if (!selectedItem || !builderRef.current || !isMapReady) return;

        try {
            const builder = builderRef.current;
            const term = selectedItem.id.toLowerCase();

            if (selectedItem.type === 'metabolite') {
                const nodes = builder?.map?.nodes;
                if (!nodes) return;

                const foundNodeId = Object.keys(nodes).find(id => {
                    const node = nodes[id];
                    return node.node_type === 'metabolite' && node.bigg_id && node.bigg_id.toLowerCase().includes(term);
                });

                if (foundNodeId && builder.map.zoom_container) {
                    const node = nodes[foundNodeId];
                    builder.map.zoom_container.go_to(0.8, [node.x, node.y]);
                    const hlData: Record<string, number> = {};
                    hlData[node.bigg_id] = 100;
                    builder.set_metabolite_data(hlData);
                }
            } else if (selectedItem.type === 'reaction') {
                const reactions = builder?.map?.reactions;
                if (!reactions) return;

                const foundRxnId = Object.keys(reactions).find(id => reactions[id].bigg_id.toLowerCase() === term);
                if (foundRxnId && builder.map.zoom_container) {
                    const rxn = reactions[foundRxnId];
                    builder.map.zoom_container.go_to(0.8, [rxn.label_x, rxn.label_y]);
                }
            }
        } catch (error) {
            console.error('Selection Mapping Error:', error);
        }
    }, [selectedItem, isMapReady]);

    // Carbon Source Focus
    useEffect(() => {
        if (!activeCarbonSource || !builderRef.current || !isMapReady) return;

        try {
            const builder = builderRef.current;
            const nodes = builder?.map?.nodes;
            if (!nodes) return;

            const term = activeCarbonSource.toLowerCase();

            const foundNodeId = Object.keys(nodes).find(id => {
                const node = nodes[id];
                return node.node_type === 'metabolite' && node.bigg_id && node.bigg_id.toLowerCase() === term;
            });

            if (foundNodeId && builder.map.zoom_container) {
                const node = nodes[foundNodeId];
                builder.map.zoom_container.go_to(0.8, [node.x, node.y]);
                const carbonHighlight: Record<string, number> = {};
                carbonHighlight[node.bigg_id] = 100;
                builder.set_metabolite_data(carbonHighlight);
            }
        } catch (error) {
            console.error('Carbon Mapping Error:', error);
        }
    }, [activeCarbonSource, isMapReady]);

    // Knockout visualization
    useEffect(() => {
        if (!builderRef.current || !isMapReady || !containerRef.current) return;

        const svg = d3.select(containerRef.current).select('svg');
        const knockoutSet = new Set(knockouts || []);

        svg.selectAll('.reaction path')
            .transition().duration(500)
            .style('stroke', (d: any) => {
                if (!d || !d.bigg_id) return null;
                return knockoutSet.has(d.bigg_id) ? '#ff4444' : null;
            })
            .style('stroke-width', (d: any) => {
                if (!d || !d.bigg_id) return null;
                return knockoutSet.has(d.bigg_id) ? '6px' : null;
            })
            .style('opacity', (d: any) => {
                if (!d || !d.bigg_id) return null;
                return knockoutSet.has(d.bigg_id) ? 0.4 : null;
            });

    }, [knockouts, isMapReady]);

    // Resize Handler for mapSize prop
    useEffect(() => {
        if (builderRef.current && isMapReady) {
            // Need a small delay for CSS transition to finish or at least start
            const timer = setTimeout(() => {
                try {
                    if (builderRef.current.map && builderRef.current.map.zoom_container) {
                        builderRef.current.map.zoom_container.update_window_size();
                    }
                } catch (e) {
                    console.warn('Escher resize failed:', e);
                }
            }, 550); // Slightly more than the 500ms CSS transition

            return () => clearTimeout(timer);
        }
    }, [mapSize, isMapReady]);

    return (
        <div
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', borderColor: '#1e293b' }}
            className="relative w-full h-[calc(100vh-200px)] border rounded-lg overflow-hidden backdrop-blur-sm escher-container"
        >
            <div ref={containerRef} className="w-full h-full" />

            {/* Context Menu */}
            {menuVisible && selectedRxn && (
                <div
                    className="fixed z-[9999] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-xl py-2 min-w-[200px] animate-in fade-in zoom-in duration-200"
                    style={{ top: menuPos.y, left: menuPos.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-4 py-2 border-b border-slate-800/50 mb-1">
                        <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Reaction ID</div>
                        <div className="text-[14px] font-black text-neon-cyan truncate">{selectedRxn.bigg_id}</div>
                        <div className="text-[12.5px] text-slate-300 truncate">{selectedRxn.name}</div>
                    </div>
                    <button
                        onClick={() => {
                            if (onKnockout) onKnockout(selectedRxn.bigg_id);
                            setMenuVisible(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-[13px] font-bold text-slate-200 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-3"
                    >
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        유전자 제거 (Knockout)
                    </button>
                    <button onClick={() => setMenuVisible(false)} className="w-full px-4 py-2.5 text-left text-[13px] font-bold text-slate-400 hover:bg-slate-800 transition-colors">
                        취소
                    </button>
                </div>
            )}

            <div
                style={{ backgroundColor: 'rgba(2, 6, 23, 0.9)', borderColor: 'rgba(34, 211, 238, 0.4)', color: '#22d3ee' }}
                className="absolute top-4 right-4 p-2.5 rounded-lg border text-[13.5px] uppercase font-black tracking-widest shadow-2xl"
            >
                Escher Visualization
            </div>
        </div>
    );
};

export default EscherMap;
