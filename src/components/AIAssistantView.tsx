import React, { useMemo, useRef, useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AssistantPersonaId, ChatMessage, RoleLevel } from '../types';
import { ASSISTANT_PERSONAS, AssistantPersona } from '../lib/assistantPersonas';

interface AIAssistantViewProps {
  businessContext: string;
  selectedDate: string;
  onDateChange: (date: string) => void;
  roleLevel: RoleLevel;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const MODEL = 'gemini-flash-latest';

const PersonaAvatar: React.FC<{ persona: AssistantPersona; className: string }> = ({
  persona,
  className,
}) => {
  if (persona.avatarImage) {
    return <img src={persona.avatarImage} alt={persona.name} className={className} />;
  }
  return (
    <div
      className={`${className} flex items-center justify-center bg-gradient-to-br from-[#0284C7] to-[#1E3A5F] text-white font-bold`}
    >
      {persona.name.charAt(0)}
    </div>
  );
};

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  businessContext,
  selectedDate,
  onDateChange,
  roleLevel,
}) => {
  const visiblePersonas = Object.values(ASSISTANT_PERSONAS).filter((p) =>
    p.visibleTo.includes(roleLevel)
  );

  const [activePersonaId, setActivePersonaId] = useState<AssistantPersonaId>(
    visiblePersonas[0]?.id || 'deniz'
  );
  const [messagesByPersona, setMessagesByPersona] = useState<
    Record<AssistantPersonaId, ChatMessage[]>
  >({ deniz: [], nueng: [], snow: [] });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visiblePersonas.some((p) => p.id === activePersonaId) && visiblePersonas[0]) {
      setActivePersonaId(visiblePersonas[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleLevel]);

  const persona = ASSISTANT_PERSONAS[activePersonaId];
  const messages = messagesByPersona[activePersonaId] || [];

  const ai = useMemo(() => {
    if (!API_KEY) return null;
    return new GoogleGenAI({ apiKey: API_KEY });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    if (!ai) {
      setErrorMsg(
        'ยังไม่ได้ตั้งค่า Gemini API Key กรุณาใส่ VITE_GEMINI_API_KEY ในไฟล์ .env.local แล้วรีสตาร์ทเซิร์ฟเวอร์'
      );
      return;
    }

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: `MSG-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    const historyForRequest = [...messages, userMsg];
    setMessagesByPersona((prev) => ({ ...prev, [activePersonaId]: historyForRequest }));
    setInput('');
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: historyForRequest.map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        })),
        config: {
          systemInstruction: persona.systemInstruction(businessContext),
        },
      });

      const replyText = response.text || 'ขออภัยค่ะ/ครับ ไม่สามารถสร้างคำตอบได้ในขณะนี้';
      const modelMsg: ChatMessage = {
        id: `MSG-${Date.now()}-r`,
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessagesByPersona((prev) => ({
        ...prev,
        [activePersonaId]: [...(prev[activePersonaId] || []), modelMsg],
      }));
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? `เกิดข้อผิดพลาด: ${err.message}` : 'เกิดข้อผิดพลาดในการเชื่อมต่อ Gemini API'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <section className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D2E0EB] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#1E3A5F] flex items-center gap-2 font-sans">
              <span className="material-symbols-outlined text-[#0284C7]">smart_toy</span>
              ผู้ช่วย AI สรุปรายวัน
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              คุยกับผู้ช่วยเพื่อสรุปงานประจำวัน โดยอ้างอิงข้อมูลจริงจากระบบร้าน
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#CBD5E1] px-3 py-1.5 rounded-xl">
            <span className="material-symbols-outlined text-sm text-[#0284C7]">calendar_today</span>
            <span className="text-xs font-bold text-[#1E3A5F]">ข้อมูลวันที่:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#0284C7] data-mono outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Persona Cards — เลือกผู้ช่วยที่จะกดถาม */}
        <div className="grid grid-cols-2 gap-4 max-w-xl">
          {visiblePersonas.map((p) => {
            const isActive = activePersonaId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePersonaId(p.id)}
                className={`relative rounded-3xl overflow-hidden border-4 transition-all cursor-pointer text-left group aspect-[3/4] ${
                  isActive
                    ? 'border-[#0284C7] shadow-lg scale-[1.01]'
                    : 'border-transparent hover:border-[#BAE6FD] shadow-xs'
                }`}
              >
                <PersonaAvatar
                  persona={p}
                  className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                  <div>
                    <p className="text-white font-bold text-lg leading-tight drop-shadow-sm">{p.name}</p>
                    <p className="text-white/90 text-xs font-medium">{p.role}</p>
                  </div>
                  <span
                    className={`material-symbols-outlined text-2xl rounded-full p-1.5 ${
                      isActive ? 'bg-[#0284C7] text-white' : 'bg-white/80 text-[#1E3A5F]'
                    }`}
                  >
                    {isActive ? 'chat' : 'touch_app'}
                  </span>
                </div>
                {isActive && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold bg-[#0284C7] text-white px-2.5 py-1 rounded-full shadow-xs">
                    กำลังคุยอยู่
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {!API_KEY && (
        <div className="bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs font-semibold px-4 py-3 rounded-2xl flex items-start gap-2">
          <span className="material-symbols-outlined text-base">warning</span>
          <span>
            ยังไม่ได้ตั้งค่า Gemini API Key — เพิ่ม <code className="bg-white/60 px-1 rounded">VITE_GEMINI_API_KEY</code> ในไฟล์{' '}
            <code className="bg-white/60 px-1 rounded">.env.local</code> แล้วรีสตาร์ทเซิร์ฟเวอร์ dev
          </span>
        </div>
      )}

      {/* Chat Window */}
      <section className="bg-white rounded-2xl border border-[#D2E0EB] shadow-xs flex flex-col h-[60vh] min-h-[420px]">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0]">
          <PersonaAvatar
            persona={persona}
            className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#D2E0EB]"
          />
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-[#1E3A5F]">{persona.name}</p>
            <p className="text-[11px] text-[#64748B] truncate">{persona.role}</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex gap-2.5 max-w-[85%]">
              <PersonaAvatar
                persona={persona}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#D2E0EB]"
              />
              <div className="bg-[#F1F5F9] text-[#1E293B] text-sm rounded-2xl rounded-tl-sm px-4 py-2.5">
                {persona.greeting}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {m.role === 'model' && (
                <PersonaAvatar
                  persona={persona}
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#D2E0EB]"
                />
              )}
              <div
                className={`text-sm px-4 py-2.5 whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[#1E3A5F] text-white rounded-2xl rounded-tr-sm'
                    : 'bg-[#F1F5F9] text-[#1E293B] rounded-2xl rounded-tl-sm'
                }`}
              >
                {m.text}
                <div
                  className={`text-[10px] mt-1 opacity-60 ${
                    m.role === 'user' ? 'text-right' : ''
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 max-w-[85%]">
              <PersonaAvatar
                persona={persona}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#D2E0EB]"
              />
              <div className="bg-[#F1F5F9] text-[#64748B] text-sm rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#94A3B8] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-[#94A3B8] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-[#94A3B8] rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mx-4 mb-2 bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold px-3 py-2 rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Quick action + input */}
        <div className="border-t border-[#E2E8F0] p-3 space-y-2">
          <button
            onClick={() => sendMessage(persona.quickAction)}
            disabled={isLoading}
            className="text-xs font-bold text-[#0284C7] bg-[#E0F2FE] hover:bg-[#BAE6FD] px-3 py-1.5 rounded-full transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 w-fit"
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            {persona.quickAction}
          </button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`พิมพ์คำถามถึง ${persona.name}...`}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-[#CBD5E1] rounded-full text-sm focus:ring-2 focus:ring-[#0284C7] outline-none disabled:bg-[#F8FAFC]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-11 h-11 shrink-0 rounded-full bg-[#1E3A5F] hover:bg-[#152C4A] disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">send</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
