"use client";

import React, { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'danger';
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

const PremiumModal: React.FC<PremiumModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    onConfirm,
    confirmText = "확인",
    cancelText = "취소"
}) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
        } else {
            const timer = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isAnimating) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 size={32} className="text-neon-green" />;
            case 'warning': return <AlertTriangle size={32} className="text-yellow-400" />;
            case 'danger': return <AlertCircle size={32} className="text-rose-500" />;
            default: return <Info size={32} className="text-neon-cyan" />;
        }
    };

    const getTypeStyles = () => {
        switch (type) {
            case 'success': return 'border-neon-green/30 shadow-[0_0_40px_rgba(74,222,128,0.15)]';
            case 'warning': return 'border-yellow-400/30 shadow-[0_0_40px_rgba(250,204,21,0.15)]';
            case 'danger': return 'border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.15)]';
            default: return 'border-neon-cyan/30 shadow-[0_0_40px_rgba(34,211,238,0.15)]';
        }
    };

    return (
        <div className={`fixed inset-0 z-[20000] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop with extreme blur */}
            <div
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-3xl animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative w-full max-w-md bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border ${getTypeStyles()} overflow-hidden transition-all duration-300 transform ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all z-10"
                >
                    <X size={20} />
                </button>

                {/* Decorative Background Light */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-neon-cyan/10 rounded-full blur-[80px]" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px]" />

                <div className="p-10 pt-12 flex flex-col items-center text-center">
                    {/* Status Icon Segment */}
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 blur-xl opacity-20 animate-pulse">
                            {getIcon()}
                        </div>
                        <div className="relative transform hover:scale-110 transition-transform duration-500">
                            {getIcon()}
                        </div>
                    </div>

                    {/* Text Segment */}
                    <h3 className="text-xl font-black text-white tracking-widest uppercase mb-4 drop-shadow-sm">
                        {title}
                    </h3>
                    <p className="text-[15px] text-slate-300 font-medium leading-relaxed px-2">
                        {message}
                    </p>

                    {/* Action Segment */}
                    <div className="mt-10 flex flex-col gap-3 w-full">
                        {onConfirm && (
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={`w-full py-4 rounded-2xl font-black tracking-[0.2em] uppercase transition-all active:scale-[0.98] shadow-lg
                                    ${type === 'danger' ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/20' :
                                        type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-yellow-900/20' :
                                            'bg-neon-cyan hover:bg-cyan-400 text-slate-950 shadow-cyan-900/20'}`}
                            >
                                {confirmText}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className={`w-full py-4 rounded-2xl font-black tracking-[0.2em] uppercase transition-all bg-white/5 hover:bg-white/10 text-slate-100 border border-white/10 active:scale-[0.98]
                                ${!onConfirm ? 'bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/20' : ''}`}
                        >
                            {onConfirm ? cancelText : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PremiumModal;
