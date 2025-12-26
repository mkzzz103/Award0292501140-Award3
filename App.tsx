
import React, { useState, useCallback, useRef } from 'react';
import Experience from './components/Experience';
import GestureController from './components/GestureController';
import { TreeColors, HandGesture, LuckyDrawStatus } from './types';

const App: React.FC = () => {
  const [targetMix, setTargetMix] = useState(1); 
  const [colors] = useState<TreeColors>({ bottom: '#022b1c', top: '#217a46' });
  const inputRef = useRef({ x: 0, y: 0, isDetected: false });
  const [userImages, setUserImages] = useState<string[]>([]);
  const [prizeImages, setPrizeImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prizeInputRef = useRef<HTMLInputElement>(null);
  const [signatureText] = useState("Merry X'mas");
  const [showCamera, setShowCamera] = useState(true);
  const [isGestureEnabled, setIsGestureEnabled] = useState(true);

  // Lucky Draw State
  const [luckyDrawState, setLuckyDrawState] = useState<LuckyDrawStatus>('IDLE');
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [currentPrize, setCurrentPrize] = useState<string | null>(null);

  const handleGesture = useCallback((data: HandGesture) => {
    if (!isGestureEnabled) return;
    if (data.isDetected) {
        const newTarget = data.isOpen ? 0 : 1;
        setTargetMix(prev => (prev !== newTarget ? newTarget : prev));
        inputRef.current = { x: data.position.x * 1.2, y: data.position.y, isDetected: true };
    } else {
        inputRef.current.isDetected = false;
    }
  }, [isGestureEnabled]);

  const startLuckyDraw = () => {
      if (userImages.length === 0) {
          alert("请先上传参与者照片！");
          return;
      }
      setLuckyDrawState('PICKING');
      setWinnerIndex(null);
      setTargetMix(0); // 散开以示洗牌
      
      setTimeout(() => {
          // 随机选人
          const randIdx = Math.floor(Math.random() * userImages.length);
          // 从上传的奖品池中随机选一个奖品
          const randPrize = prizeImages.length > 0 
            ? prizeImages[Math.floor(Math.random() * prizeImages.length)]
            : null;
          
          setWinnerIndex(randIdx);
          setCurrentPrize(randPrize);
          setLuckyDrawState('WINNER');
      }, 3000); 
  };

  const revealPrize = () => {
      setLuckyDrawState('REVEALED');
  };

  const resetLuckyDraw = () => {
      setLuckyDrawState('IDLE');
      setWinnerIndex(null);
      setCurrentPrize(null);
      setTargetMix(1); 
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setIsProcessing(true);
          setTargetMix(0);
          setTimeout(() => {
              const files = Array.from(e.target.files!).slice(0, 30);
              const urls = files.map((file: File) => URL.createObjectURL(file));
              setUserImages(prev => { prev.forEach(url => URL.revokeObjectURL(url)); return urls; });
              if (fileInputRef.current) fileInputRef.current.value = '';
              setTimeout(() => { setIsProcessing(false); setTimeout(() => setTargetMix(1), 800); }, 1200); 
          }, 50);
      }
  };

  const handlePrizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const files = Array.from(e.target.files!);
          const urls = files.map((file: File) => URL.createObjectURL(file));
          setPrizeImages(urls);
          alert(`奖品池已就绪：共收到 ${urls.length} 种奖品图。`);
      }
  };

  const iconBtnClass = `group relative w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 text-slate-300 transition-all duration-500 hover:border-white/60 hover:text-white hover:bg-white/10 active:scale-90 flex justify-center items-center cursor-pointer shadow-lg`;
  const actionBtnClass = `px-12 h-12 rounded-full bg-white text-black font-luxury text-xs uppercase tracking-[0.3em] transition-all duration-500 hover:scale-110 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.4)] cursor-pointer flex items-center justify-center`;

  return (
    <div className="relative w-full h-screen bg-[#010a05] overflow-hidden">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
      <input type="file" ref={prizeInputRef} onChange={handlePrizeChange} accept="image/*" multiple className="hidden" />

      {isProcessing && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
              <div className="w-12 h-12 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-[#d4af37] font-luxury tracking-widest text-xs uppercase animate-pulse">正在装饰拍立得...</div>
          </div>
      )}

      <div className="absolute inset-0 z-10">
        <Experience 
          mixFactor={targetMix} 
          colors={colors} 
          inputRef={inputRef} 
          userImages={userImages} 
          signatureText={signatureText} 
          luckyDrawState={luckyDrawState} 
          winnerIndex={winnerIndex} 
          prizeImage={currentPrize} 
        />
      </div>

      <div className={`absolute top-10 left-0 w-full flex justify-center pointer-events-none z-0 transition-opacity duration-700 ${luckyDrawState !== 'IDLE' ? 'opacity-0' : 'opacity-100'}`}>
         <h1 className="font-script text-8xl md:text-9xl text-white/90 drop-shadow-2xl">Merry Christmas</h1>
      </div>

      {luckyDrawState === 'WINNER' && (
          <div className="absolute bottom-24 left-0 w-full z-50 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="text-white font-luxury tracking-[0.5em] text-2xl drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">LUCKY WINNER</div>
              <button onClick={revealPrize} className={actionBtnClass}>点击开奖</button>
          </div>
      )}

      {luckyDrawState === 'REVEALED' && (
          <div className="absolute bottom-24 left-0 w-full z-50 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-10">
              <div className="text-[#d4af37] font-luxury tracking-[0.5em] text-2xl drop-shadow-glow">CONGRATULATIONS!</div>
              <button onClick={resetLuckyDraw} className={`${actionBtnClass} bg-transparent border border-white/30 text-white`}>重置抽奖</button>
          </div>
      )}

      <div className={`absolute top-6 right-6 z-30 flex flex-col gap-4 transition-opacity duration-500 ${luckyDrawState !== 'IDLE' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <button onClick={startLuckyDraw} className={`${iconBtnClass} border-yellow-500/50 text-yellow-500`} title="开始抽奖">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-10.5v10.5" /></svg>
          </button>
          <button onClick={() => prizeInputRef.current?.click()} className={iconBtnClass} title="管理奖品池(上传多张)">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25m18 0l-3-3m3 3l-3 3m-12-3l3-3m-3 3l3 3" /></svg>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className={iconBtnClass} title="上传参与者照片">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
          </button>
          
          <button onClick={() => setTargetMix(prev => prev === 1 ? 0 : 1)} className={iconBtnClass} title={targetMix === 1 ? "手动散开" : "聚拢形状"}>
            {targetMix === 1 ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>
            )}
          </button>

          <button onClick={() => setIsGestureEnabled(!isGestureEnabled)} className={`${iconBtnClass} ${isGestureEnabled ? 'text-green-400 border-green-500/50' : ''}`} title="手势AI开关">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.57c.4-1.09 1.39-1.76 2.5-1.77 1.1-.01 2.1.66 2.5 1.76l1.2 3.24c.06.16.2.26.37.28l3.52.41c1.2.14 1.68 1.61.76 2.42l-2.58 2.29c-.13.12-.19.3-.15.48l.74 3.46c.25 1.18-1.01 2.08-2.05 1.44l-3.08-1.9c-.15-.09-.34-.09-.5 0l-3.08 1.9c-1.04.64-2.3-.26-2.05-1.44l.74-3.46c.04-.18-.02-.36-.15-.48L2.2 10.93c-.92-.81-.44-2.28.76-2.42l3.52-.41c.17-.02.31-.12.37-.28l1.2-3.25z" /></svg>
          </button>
          <button onClick={() => setShowCamera(!showCamera)} className={iconBtnClass} title="摄像头显示/隐藏">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
          </button>
      </div>

      <GestureController onGesture={handleGesture} isGuiVisible={showCamera && isGestureEnabled} />

      <style>{`
        .drop-shadow-glow { filter: drop-shadow(0 0 15px rgba(212,175,55,0.5)); }
      `}</style>
    </div>
  );
};

export default App;
