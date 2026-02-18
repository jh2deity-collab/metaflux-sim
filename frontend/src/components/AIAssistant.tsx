"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Mic, Send, X, MessageSquare, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

interface AIAssistantProps {
    modelId?: string;
    contextData?: any;
    onLastMessage?: (text: string) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ modelId, contextData, onLastMessage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: "안녕하세요! 미생물 분석 AI 도우미입니다. 무엇을 도와드릴까요?", sender: 'ai', timestamp: new Date() }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Audio/Speech Recognition Setup
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'ko-KR';

            rec.onstart = () => setIsListening(true);
            rec.onend = () => setIsListening(false);
            rec.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
                handleSend(transcript);
            };

            setRecognition(rec);
        }
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }

        // Notify parent of the last AI message for reporting
        const aiMessages = messages.filter(m => m.sender === 'ai');
        if (aiMessages.length > 0 && onLastMessage) {
            onLastMessage(aiMessages[aiMessages.length - 1].text);
        }
    }, [messages, isTyping, onLastMessage]);

    const handleSend = async (text: string = inputValue) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const res = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    model_id: modelId,
                    context: contextData
                })
            });
            const data = await res.json();

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response,
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('Chat failed:', error);
            const errorMsg: Message = {
                id: (Date.now() + 2).toString(),
                text: "⚠️ 서버와 통신할 수 없습니다. 백엔드 서버가 실행 중인지 확인해 주세요.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognition?.stop();
        } else {
            recognition?.start();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[1000]">
            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${isOpen ? 'bg-slate-800 rotate-90 scale-0' : 'bg-neon-cyan hover:scale-110'
                    }`}
            >
                <Bot className="w-7 h-7 text-slate-900" />
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-0 right-0 w-[380px] h-[520px] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-800/50 flex items-center justify-between bg-gradient-to-r from-neon-cyan/10 to-transparent">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-neon-cyan" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">MetaFlux AI</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[11px] text-slate-200 font-bold uppercase">Online Help</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Body */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-3xl text-[14px] leading-relaxed shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.sender === 'user'
                                    ? 'bg-gradient-to-br from-neon-cyan/20 to-neon-cyan/5 border border-neon-cyan/30 text-slate-100 rounded-tr-none'
                                    : 'bg-slate-900/60 border border-slate-800/50 text-slate-200 rounded-tl-none backdrop-blur-xl'
                                    }`}>
                                    {msg.sender === 'ai' ? (
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700/30">
                                    <div className="flex gap-1">
                                        <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" />
                                        <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce delay-75" />
                                        <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce delay-150" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Footer */}
                    <div className="p-4 bg-slate-950/50 border-t border-slate-800/50">
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/50 rounded-xl p-1.5 focus-within:border-neon-cyan/50 transition-all">
                            <button
                                onClick={toggleListening}
                                className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-500/20 text-red-500' : 'text-slate-500 hover:text-neon-cyan'
                                    }`}
                            >
                                <Mic size={18} />
                            </button>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="생물학적 호기심을 질문해 보세요..."
                                className="flex-1 bg-transparent border-none text-[13px] text-slate-200 focus:outline-none px-2"
                            />
                            <button
                                onClick={() => handleSend()}
                                className="p-2 bg-neon-cyan rounded-lg text-slate-900 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIAssistant;
