
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { ChatMessage } from '../types';
import { askAiAssistant } from '../services/geminiService';

interface Props {
  context?: string;
}

// Manual decode function as per guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Manual encode function as per guidelines
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Manual audio decoding as per guidelines
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const AIAssistant: React.FC<Props> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'CHAT' | 'LIVE'>('CHAT');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const toggleAssistant = () => setIsOpen(!isOpen);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', text: inputText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    const result = await askAiAssistant(inputText, context);
    
    const modelMsg: ChatMessage = { 
      role: 'model', 
      text: result.text || '', 
      timestamp: Date.now(),
      groundingLinks: result.links
    };
    setMessages(prev => [...prev, modelMsg]);
    setIsTyping(false);
  };

  function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  // --- Live API Handlers ---
  const startLiveSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputAudioContext;
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let nextStartTime = 0;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsLiveActive(true);
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64EncodedAudioString && audioContextRef.current) {
              nextStartTime = Math.max(nextStartTime, audioContextRef.current.currentTime);
              const audioBuffer = await decodeAudioData(
                decode(base64EncodedAudioString),
                audioContextRef.current,
                24000,
                1,
              );
              const source = audioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioContextRef.current.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              source.start(nextStartTime);
              nextStartTime = nextStartTime + audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) {
              for (const source of sourcesRef.current.values()) {
                source.stop();
              }
              sourcesRef.current.clear();
              nextStartTime = 0;
            }
          },
          onclose: () => setIsLiveActive(false),
          onerror: (e) => console.error(e)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'شما یک دستیار صوتی هوشمند برای تحلیل فرهنگ سازمانی هستید.'
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      alert("خطا در برقراری ارتباط صوتی");
    }
  };

  const stopLiveSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    setIsLiveActive(false);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col items-end gap-4">
      {isOpen && (
        <div className="w-[380px] h-[550px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in origin-bottom-left transition-colors">
          {/* Header */}
          <div className="p-4 bg-brand-600 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isLiveActive ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`}></div>
              <h3 className="font-bold">دستیار هوشمند (Gemini)</h3>
            </div>
            <div className="flex bg-white/20 rounded-lg p-1">
                <button onClick={() => setMode('CHAT')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${mode === 'CHAT' ? 'bg-white text-brand-700' : 'text-white hover:bg-white/10'}`}>متن</button>
                <button onClick={() => setMode('LIVE')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${mode === 'LIVE' ? 'bg-white text-brand-700' : 'text-white hover:bg-white/10'}`}>صوت</button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950 transition-colors" ref={scrollRef}>
            {mode === 'CHAT' ? (
              <>
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                    <svg className="w-12 h-12 mb-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <p className="text-sm">چگونه می‌توانم در تحلیل فرهنگ سازمانی به شما کمک کنم؟</p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 border border-gray-100 dark:border-slate-700'}`}>
                      {m.text}
                      {m.groundingLinks && m.groundingLinks.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700 space-y-1">
                          <p className="text-[10px] font-bold opacity-50">منابع جستجو:</p>
                          {m.groundingLinks.map((link, idx) => (
                            <a key={idx} href={link.uri} target="_blank" rel="noopener" className="block text-[11px] text-blue-500 hover:underline truncate">{link.title || link.uri}</a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-end">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 transition-colors">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isLiveActive ? 'bg-red-100 dark:bg-red-900/30 scale-110' : 'bg-brand-50 dark:bg-brand-900/30'}`}>
                   {isLiveActive ? (
                     <div className="relative">
                        <div className="absolute inset-0 bg-red-400 rounded-full animate-ping"></div>
                        <svg className="w-16 h-16 text-red-600 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v5a3 3 0 01-6 0V5a3 3 0 013-3z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                     </div>
                   ) : (
                    <svg className="w-16 h-16 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v5a3 3 0 01-6 0V5a3 3 0 013-3z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                   )}
                </div>
                <h4 className="mt-8 font-bold text-gray-800 dark:text-white">{isLiveActive ? 'در حال شنیدن...' : 'مکالمه صوتی زنده'}</h4>
                <p className="text-sm text-gray-500 mt-2">با هوش مصنوعی به صورت زنده درباره تحلیل‌های خود صحبت کنید.</p>
                <button onClick={isLiveActive ? stopLiveSession : startLiveSession} className={`mt-10 px-8 py-3 rounded-full font-bold shadow-lg transition-all active:scale-95 ${isLiveActive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-brand-600 text-white hover:bg-brand-700'}`}>
                    {isLiveActive ? 'قطع تماس' : 'شروع مکالمه'}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {mode === 'CHAT' && (
            <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex gap-2 transition-colors">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="سوال خود را بپرسید..."
                className="flex-1 bg-slate-100 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm"
              />
              <button onClick={handleSendMessage} className="w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center hover:bg-brand-700 transition-colors shadow-md">
                <svg className="w-5 h-5 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={toggleAssistant}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 active:scale-95 z-[101] ${isOpen ? 'bg-white text-gray-800 rotate-90' : 'bg-brand-600 text-white'}`}
      >
        {isOpen ? (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </button>
    </div>
  );
};

export default AIAssistant;
