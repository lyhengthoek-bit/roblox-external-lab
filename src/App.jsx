import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from 'motion/react';
import { ArrowDown, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUp, Check, Copy, Download, ExternalLink, Info, Maximize2, Menu, Monitor, ScanEye, X, ZoomIn, ZoomOut } from 'lucide-react';
import InteractivePreview from './InteractivePreview.jsx';

const SHA = '8cc8f97ba0fc604c54bd72c79853ab0cf7c71357ccce6af9cf5fd3a9af4489da';
const BASE_URL = import.meta.env.BASE_URL;
const screens = [
  { id:'effects', title:'Body effects', label:'01 / EFFECTS', image:`${BASE_URL}assets/gui-effects.png`, description:'Outline, electric lines, scan bands, and color controls.', caption:'Effects / White theme' },
  { id:'aim', title:'Targeting, organized.', label:'02 / AIM', image:`${BASE_URL}assets/gui-aim.png`, description:'Separate tabs for targeting, response, activation, and trigger settings.', caption:'Aim / Targeting' },
  { id:'misc', title:'Character, read-only.', label:'03 / CHARACTER', image:`${BASE_URL}assets/gui-misc.png`, description:'Live character values. External movement editing removed.', caption:'Character / Read-only values' },
  { id:'dark', title:'A quieter shade.', label:'04 / CHARCOAL', image:`${BASE_URL}assets/gui-dark.png`, description:'The same interface, with a charcoal theme.', caption:'Interface / Charcoal theme' },
  { id:'interface', title:'Make it your setup.', label:'05 / INTERFACE', image:`${BASE_URL}assets/gui-interface.png`, description:'Interface scale, motion settings, and local customization.', caption:'Interface / White theme' },
];
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));

function Loader() {
  const [count,setCount] = useState(0);
  const [done,setDone] = useState(false);
  useEffect(() => {
    let active = true, completed = 0;
    const images = screens.map(screen => {
      const img = new Image();
      const settle = () => { if (active) { setCount(++completed); if (completed === screens.length) setDone(true); } };
      img.onload = settle; img.onerror = settle; img.src = screen.image;
      return img;
    });
    const timeout = setTimeout(() => setDone(true), 4000);
    return () => { active=false; clearTimeout(timeout); images.forEach(img => { img.onload=null; img.onerror=null; }); };
  },[]);
  return <AnimatePresence>{!done && <motion.div id="boot" className="boot" role="status" aria-label="Loading interface previews" exit={{opacity:0}} transition={{duration:.3}}>
    <div className="flex items-center gap-3"><ScanEye size={24}/><span className="font-semibold">EXTERNAL</span><span className="mono text-white/40">/ 11</span></div>
    <div className="boot-track"><motion.div id="boot-progress" role="progressbar" aria-label="Preview assets" aria-valuemin={0} aria-valuemax={5} aria-valuenow={count} animate={{scaleX:count/5}}/></div>
    <span className="mono text-white/40">Preparing the interface</span>
  </motion.div>}</AnimatePresence>;
}

function Navbar({scrollY,progress,reduced}) {
  const [open,setOpen] = useState(false);
  const width = useTransform(scrollY,[0,200],['100%','94%']);
  const y = useTransform(scrollY,[0,200],[0,12]);
  const scale = useTransform(scrollY,[0,200],[1,.98]);
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <motion.header className="site-header" style={{width:reduced?'94%':width,y:reduced?0:y,scale:reduced?1:scale}}>
      <a href="#overview" className="wordmark" aria-label="External, overview"><ScanEye size={22}/><span>EXTERNAL</span><span className="mono version">/11</span></a>
      <nav id="main-nav" className={open?'is-open':''} aria-label="Main navigation"><a href="#interface" onClick={()=>setOpen(false)}>Interface</a><a href="#playground" onClick={()=>setOpen(false)}>Preview</a><a href="#release" onClick={()=>setOpen(false)}>Release</a></nav>
      <a href="#release" className="header-download">Download <ArrowDownRight size={16}/></a>
      <button id="nav-toggle" className="icon-button nav-toggle" aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="main-nav" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
    </motion.header>
    <motion.div className="reading-progress" aria-hidden="true" style={{scaleX:progress}}/>
  </>;
}

function VelocityGrid({scrollY,reduced}) {
  const velocity = useVelocity(scrollY);
  const drift = useSpring(velocity,{stiffness:100,damping:28,mass:.5});
  const skew = useTransform(drift,v=>clamp(v/1000,-3,3));
  const opacity = useTransform(drift,v=>.04+clamp(Math.abs(v)/9000,0,.12));
  return <motion.div className="velocity-grid" aria-hidden="true" style={{skewY:reduced?0:skew,opacity:reduced?.04:opacity}}/>;
}

function MediaCursor({scrollY,reduced}) {
  const [visible,setVisible]=useState(false);
  const px=useMotionValue(-100),py=useMotionValue(-100);
  const x=useSpring(px,{stiffness:450,damping:36}),y=useSpring(py,{stiffness:450,damping:36});
  const velocity=useVelocity(scrollY);
  const skew=useTransform(velocity,v=>clamp(v/1200,-8,8));
  useEffect(()=>{
    if(reduced||!window.matchMedia('(pointer:fine)').matches)return;
    const update=event=>{px.set(event.clientX+18);py.set(event.clientY+18);setVisible(Boolean(event.target.closest('.hero-image,.card-media,.reveal-media')));};
    const hide=()=>setVisible(false);
    window.addEventListener('pointermove',update,{passive:true});document.addEventListener('pointerleave',hide);
    return()=>{window.removeEventListener('pointermove',update);document.removeEventListener('pointerleave',hide);};
  },[reduced,px,py]);
  return reduced?null:<motion.div className="media-cursor" aria-hidden="true" style={{x,y,skewY:skew,opacity:visible?1:0}}><Maximize2 size={16}/></motion.div>;
}

function TiltLetter({letter,index,progress,reduced}) {
  const rotateX = useTransform(progress,[0,.4,.8],[-18-index*.9,0,30]);
  const y = useTransform(progress,[0,.4,.8],[index%2?3:-3,0,-20-index*2]);
  return <motion.span aria-hidden="true" style={{rotateX:reduced?0:rotateX,y:reduced?0:y}}>{letter===' '?'\u00a0':letter}</motion.span>;
}

function Hero({onPreview,reduced}) {
  const ref = useRef(null);
  const {scrollYProgress} = useScroll({target:ref,offset:['start start','end start']});
  const eased = useSpring(scrollYProgress,{stiffness:180,damping:32,mass:.3});
  const rotateX = useTransform(eased,[0,.5,1],[14,0,-3]);
  const rotateY = useTransform(eased,[0,.5],[7,0]);
  const scale = useTransform(scrollYProgress,[0,.6,1],[1.03,.86,.86]);
  const y = useTransform(scrollYProgress,[0,.7],[0,85]);
  const opacity = useTransform(scrollYProgress,[0,.65,1],[1,1,.2]);
  const line = useTransform(scrollYProgress,[0,.8],[1,0]);
  return <section id="overview" className="hero" ref={ref} aria-labelledby="hero-title">
    <div className="hero-meta wrap mono"><span><span className="status-dot"/>EXPERIMENTAL / V11</span><span>WINDOWS X64</span></div>
    <div className="hero-copy wrap">
      <h1 id="hero-title" aria-label="Roblox External">{'Roblox External'.split('').map((letter,index)=><TiltLetter key={index} {...{letter,index,reduced}} progress={scrollYProgress}/>)}</h1>
      <p>A standalone Windows overlay.<br/>Built in C++. Made to be yours.</p>
      <a href="#interface" className="text-link">Explore the interface <ArrowDown size={16}/></a>
    </div>
    <div className="hero-scene">
      <motion.button className="hero-image" id="open-hero" onClick={event=>onPreview(screens[0],event.currentTarget)} aria-label="Inspect the full-resolution v11 GUI screenshot" style={{rotateX:reduced?0:rotateX,rotateY:reduced?0:rotateY,scale:reduced?1:scale,y:reduced?0:y,opacity:reduced?1:opacity}}>
        <img src={screens[0].image} width="1440" height="900" alt="Actual v11 white Effects GUI with red electric outlines and a local dummy" fetchPriority="high"/>
        <span className="inspect-label mono"><Maximize2 size={14}/> ACTUAL V11 CAPTURE</span>
      </motion.button>
      <motion.div className="scene-coordinate mono" style={{opacity:reduced?.5:line}} aria-hidden="true"><span>X / 00</span><span>Y / 11</span></motion.div>
    </div>
    <div className="hero-bottom wrap mono"><span>VISUALS. SETTINGS. YOUR SETUP.</span><a href="#statement" aria-label="Continue to the next section"><ArrowDown size={18}/></a><span>01 / 06</span></div>
  </section>;
}

function LitWord({word,index,total,progress,reduced}) {
  const start = index/total*.7;
  const opacity = useTransform(progress,[start,start+.16],[.15,1]);
  const y = useTransform(progress,[start,start+.16],[7,0]);
  return <motion.span className="lit-word" style={{opacity:reduced?1:opacity,y:reduced?0:y}}>{word} </motion.span>;
}

function Statement({reduced}) {
  const ref = useRef(null);
  const {scrollYProgress} = useScroll({target:ref,offset:['start .8','end .8']});
  const lines = ['A clearer view.','A calmer workspace.','A setup that\'s yours.'];
  let index=0;
  const total=lines.join(' ').split(' ').length;
  return <section id="statement" ref={ref} className="statement" aria-labelledby="statement-title">
    <div className="statement-inner wrap">
      <span className="section-index mono">02 / A LITTLE MORE CONSIDERED</span>
      <h2 id="statement-title">{lines.map((line,i)=><span className="statement-line" key={i}>{line.split(' ').map(word=><LitWord key={index} {...{word,total,reduced}} index={index++} progress={scrollYProgress}/>)}</span>)}</h2>
      <div className="statement-footer"><span className="mono">C++ / DEAR IMGUI / DIRECTX 11</span><p>The interface, without the clutter.</p></div>
    </div>
  </section>;
}

function ShowcaseCard({screen,index,progress,reduced,onPreview,onKeyboardFocus}) {
  const position=index/4;
  const rotateY=useTransform(progress,[position-.3,position,position+.3],[7,0,-7]);
  const y=useTransform(progress,[position-.3,position,position+.3],[16,0,16]);
  const scale=useTransform(progress,[position-.35,position,position+.35],[.96,1,.96]);
  return <motion.article className="showcase-card" data-screen={screen.id} onFocusCapture={event=>{if(event.target.matches(':focus-visible'))onKeyboardFocus(index);}} style={{rotateY:reduced?0:rotateY,y:reduced?0:y,scale:reduced?1:scale}}>
    <div className="card-heading"><span className="mono">{screen.label}</span><button className="icon-button" aria-label={`Expand ${screen.title} screenshot`} title="Full-resolution screenshot" onClick={event=>onPreview(screen,event.currentTarget)}><Maximize2 size={18}/></button></div>
    <button className="card-media" onClick={event=>onPreview(screen,event.currentTarget)} aria-label={`Open ${screen.caption}`}><img src={screen.image} width="1440" height="900" alt={`Actual v11 ${screen.caption} screenshot`} loading="eager"/></button>
    <div className="card-copy"><h3>{screen.title}</h3><p>{screen.description}</p></div>
  </motion.article>;
}

function Showcase({onPreview,reduced}) {
  const ref=useRef(null), track=useRef(null), viewport=useRef(null);
  const [distance,setDistance]=useState(0),[vh,setVh]=useState(900),[mobile,setMobile]=useState(false),[chapter,setChapter]=useState(0);
  const {scrollYProgress}=useScroll({target:ref,offset:['start start','end end']});
  const x=useTransform(scrollYProgress,[0,1],[0,-distance]);
  const active=useTransform(scrollYProgress,v=>Math.min(5,Math.floor(v*4)+1).toString().padStart(2,'0'));
  useEffect(()=>scrollYProgress.on('change',value=>setChapter(Math.round(value*4))),[scrollYProgress]);
  useLayoutEffect(()=>{
    const resize=()=>{setMobile(window.innerWidth<760);setVh(window.innerHeight);setDistance(Math.max(0,track.current.scrollWidth-viewport.current.clientWidth));};
    resize();const observer=new ResizeObserver(resize);observer.observe(viewport.current);observer.observe(track.current);
    window.addEventListener('resize',resize);return()=>{observer.disconnect();window.removeEventListener('resize',resize);};
  },[]);
  const pinned=!mobile&&!reduced;
  const goTo=index=>window.scrollTo({top:ref.current.offsetTop+index/4*(ref.current.offsetHeight-vh),behavior:'smooth'});
  const move=direction=>{
    const next=clamp(Math.round(scrollYProgress.get()*4)+direction,0,4)/4;
    window.scrollTo({top:ref.current.offsetTop+next*(ref.current.offsetHeight-vh),behavior:'smooth'});
  };
  const revealFocused=index=>{
    if(!pinned)return;
    const card=track.current.children[index];
    const target=clamp((card.offsetLeft-(viewport.current.clientWidth-card.offsetWidth)/2)/distance,0,1);
    window.scrollTo({top:ref.current.offsetTop+target*(ref.current.offsetHeight-vh),behavior:'instant'});
  };
  return <section id="interface" className={`showcase ${pinned?'is-pinned':'is-flow'}`} ref={ref} style={{height:pinned?distance+vh+80:'auto'}} aria-labelledby="interface-title">
    <div className="showcase-sticky">
      <div className="section-heading wrap"><div><span className="section-index mono">03 / INSIDE THE INTERFACE</span><h2 id="interface-title">Five views. One workspace.</h2></div><div className="showcase-tools"><a className="mono skip-sweep" href="#playground">Skip to preview <ArrowDown size={14}/></a>{pinned&&<div className="sweep-arrows"><button className="icon-button" aria-label="Previous interface view" title="Previous view" onClick={()=>move(-1)}><ArrowLeft/></button><button className="icon-button" aria-label="Next interface view" title="Next view" onClick={()=>move(1)}><ArrowRight/></button></div>}</div></div>
      <div className="showcase-viewport" ref={viewport}>
        <motion.div className="showcase-track" id="showcase-track" ref={track} style={{x:pinned?x:0}}>{screens.map((screen,index)=><ShowcaseCard key={screen.id} {...{screen,index,onPreview}} onKeyboardFocus={revealFocused} reduced={!pinned} progress={scrollYProgress}/>)}</motion.div>
      </div>
      <div className="sweep-footer wrap mono"><span>ACTUAL APPLICATION CAPTURES</span>{pinned&&<div className="chapter-nav" aria-label="Interface views">{screens.map((screen,index)=><button key={screen.id} aria-label={`Show ${screen.title}`} aria-current={chapter===index?'step':undefined} title={screen.title} onClick={()=>goTo(index)}><span className="chapter-rail"/><span>{String(index+1).padStart(2,'0')}</span></button>)}</div>}<span><motion.span>{pinned?active:'05'}</motion.span> / 05</span></div>
    </div>
  </section>;
}

function ParallaxLayer({progress,speed,className,children,reduced}) {
  const y=useTransform(progress,[0,1],[100*speed,-100*speed]);
  return <motion.div className={className} style={{y:reduced?0:y}}>{children}</motion.div>;
}

function MediaReveal({onPreview,reduced}) {
  const ref=useRef(null);
  const {scrollYProgress}=useScroll({target:ref,offset:['start end','end end']});
  const clipPath=useTransform(scrollYProgress,[.1,.72],['inset(35% 42% 35% 42% round 90px)','inset(0% 0% 0% 0% round 0px)']);
  const scale=useTransform(scrollYProgress,[0,.8],[1.2,1]);
  return <section id="closer" className="reveal-section" ref={ref} aria-labelledby="reveal-title">
    <motion.div className="reveal-heading wrap" initial={reduced?false:{opacity:0,y:35}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.6}} transition={{duration:.7,ease:[.2,.8,.2,1]}}><span className="section-index mono">04 / A CLOSER LOOK</span><h2 id="reveal-title">Every detail, in view.</h2><p>Real interface. Full resolution.</p></motion.div>
    <div className="reveal-stage">
      <ParallaxLayer className="parallax-ruler ruler-a" progress={scrollYProgress} speed={.2} reduced={reduced}><span className="mono">01 : 11</span><span className="ruler-line"/></ParallaxLayer>
      <ParallaxLayer className="parallax-ruler ruler-b" progress={scrollYProgress} speed={.5} reduced={reduced}><span className="ruler-line"/></ParallaxLayer>
      <ParallaxLayer className="parallax-caption" progress={scrollYProgress} speed={1.2} reduced={reduced}><span className="mono">INTERFACE / CHARCOAL</span></ParallaxLayer>
      <ParallaxLayer className="parallax-axis" progress={scrollYProgress} speed={2} reduced={reduced}><span>+</span><span>+</span></ParallaxLayer>
      <motion.button className="reveal-media" id="open-reveal" style={{clipPath:reduced?'none':clipPath}} onClick={event=>onPreview(screens[3],event.currentTarget)} aria-label="Open full-resolution charcoal interface">
        <motion.img src={screens[3].image} width="1440" height="900" alt="Actual v11 charcoal GUI, showing interface customization controls" style={{scale:reduced?1:scale}}/>
      </motion.button>
    </div>
  </section>;
}

function DownloadSection({notify,reduced}) {
  const checksumRef=useRef(null);
  const [copied,setCopied]=useState(false);
  async function copy(){
    try {await navigator.clipboard.writeText(SHA);setCopied(true);notify('Checksum copied');setTimeout(()=>setCopied(false),2500);}
    catch {const range=document.createRange();range.selectNodeContents(checksumRef.current);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);notify('Clipboard unavailable. Checksum selected.');}
  }
  return <section id="release" className="download-section" aria-labelledby="download-title">
    <motion.div className="wrap" initial={reduced?false:{opacity:0,y:32}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.1}} transition={{duration:.6}}>
      <span className="section-index mono">06 / THE NEXT STEP</span>
      <div className="download-heading"><h2 id="download-title">Take it from here.</h2><span className="release-platform mono"><Monitor size={16}/>WINDOWS / X64</span></div>
      <p className="download-intro">Release 11. Standalone app. Matching C++ source.</p>
      <div className="download-row"><div><h3>RobloxExternal-v11.exe</h3><span className="mono file-meta">1.56 MiB / EXPERIMENTAL</span></div><a className="download-primary" id="download-exe" href={`${BASE_URL}downloads/RobloxExternal-v11.exe`} download="RobloxExternal-v11.exe" onClick={()=>notify('v11 executable download requested')}>Download for Windows <Download size={20}/></a></div>
      <div className="download-row source-row"><div><h3>Source code</h3><span className="mono file-meta">1.25 MiB / C++ / DEAR IMGUI</span></div><a className="text-link" id="download-source" href={`${BASE_URL}downloads/RobloxExternal-v11-source.zip`} download="RobloxExternal-v11-source.zip" onClick={()=>notify('v11 source download requested')}>Download source <ArrowDownRight size={20}/></a></div>
      <div className="requirements"><span className="mono">REQUIREMENTS</span><p>Windows 10/11 x64. DirectX 11 graphics.<br/>Current Microsoft Visual C++ v14 x64 runtime.</p><a href="https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170" target="_blank" rel="noopener noreferrer" className="text-link">Microsoft runtime <ExternalLink size={15}/></a></div>
      <div className="checksum"><span className="mono">EXE / SHA-256</span><code id="exe-checksum" ref={checksumRef}>{SHA}</code><button className="icon-button" id="copy-checksum" aria-label="Copy executable checksum" title="Copy checksum" onClick={copy}>{copied?<Check/>:<Copy/>}</button></div>
      <div className="release-disclosure"><Info size={20}/><div><h3>Experimental. Not universal.</h3><p>External speed/jump editing has been removed. This is not a bypass and does not guarantee avoidance of Error 268 or other client protection responses. Aim and trigger input start disabled. Use only where you have permission.</p></div></div>
      <div className="release-notes-grid"><article><span className="mono">REMOVED</span><h3>Movement writes.</h3><p>Speed and jump editing, writable process privileges, and movement write APIs.</p></article><article><span className="mono">RETAINED</span><h3>Your interface tools.</h3><p>Effects, crosshair previews, profiles, search, undo/redo, and session diagnostics.</p></article><article><span className="mono">LIMITS</span><h3>Compatibility varies.</h3><p>Client updates, custom rigs, teams, and streamed data affect behavior. Silent aim and visibility checks are unavailable.</p></article></div>
      <div className="faq"><details><summary>Does it work in every Roblox game?<span>+</span></summary><p>No universal compatibility is promised. This release depends on supported client data. Unavailable streamed characters and custom game behavior may limit functionality.</p></details><details><summary>What was actually tested?<span>+</span></summary><p>The Release/x64 build, self-tests, and hidden GUI render checks passed. Those checks did not emit Windows input or write to the game. Live aiming and trigger firing have not been verified.</p></details><details><summary>Does the browser preview connect to Roblox?<span>+</span></summary><p>No. The preview is a local two-dimensional simulation. All interface screenshots are actual v11 application captures.</p></details></div>
    </motion.div>
  </section>;
}

function RollingDigit({digit,active,reduced}){
  return <span className="clock-slot" aria-hidden="true"><motion.span className="clock-reel" animate={{y:`-${(active?digit:0)*10}%`}} transition={{duration:reduced?0:.7,ease:[.2,.8,.2,1]}}>{Array.from({length:10},(_,i)=><span key={i}>{i}</span>)}</motion.span></span>;
}

function Footer({reduced}){
  const ref=useRef(null),active=useInView(ref,{amount:.1});
  const [time,setTime]=useState(()=>new Date().toISOString().slice(11,19));
  useEffect(()=>{if(!active)return;const tick=()=>setTime(new Date().toISOString().slice(11,19));tick();const interval=setInterval(tick,1000);return()=>clearInterval(interval);},[active]);
  return <footer className="site-footer wrap" ref={ref}>
    <div className="footer-top"><span className="wordmark"><ScanEye size={22}/>EXTERNAL / 11</span><a className="icon-button" href="#overview" aria-label="Back to top" title="Back to top"><ArrowUp/></a></div>
    <div className="footer-clock" aria-label={`Current UTC time ${time}`}><span className="mono clock-label">LIVE / UTC</span><div className="clock-digits">{time.split('').map((digit,i)=>digit===':'?<span className="clock-colon" key={i}>:</span>:<RollingDigit key={i} digit={Number(digit)} {...{active,reduced}}/>)}</div></div>
    <div className="footer-bottom mono"><p>INDEPENDENT EXPERIMENTAL SOFTWARE.<br/>NOT AFFILIATED WITH OR ENDORSED BY ROBLOX.</p><span>BUILT IN C++ / RELEASE 11</span></div>
  </footer>;
}

function Lightbox({screen,close,returnFocus}){
  const ref=useRef(null);const [zoomed,setZoomed]=useState(false);
  useEffect(()=>{ref.current.showModal();const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old;returnFocus?.focus({preventScroll:true});};},[returnFocus]);
  return <dialog id="preview-dialog" ref={ref} className="preview-dialog" aria-label="Full-resolution GUI preview" onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===ref.current)close();}}><div className="dialog-toolbar"><span className="mono" id="dialog-caption">{screen.caption}</span><div className="flex gap-2"><button id="zoom-image" className="icon-button" aria-label={zoomed?'Fit screenshot':'Zoom screenshot'} aria-pressed={zoomed} title={zoomed?'Fit screenshot':'Zoom screenshot'} onClick={()=>setZoomed(!zoomed)}>{zoomed?<ZoomOut/>:<ZoomIn/>}</button><button id="close-gallery" className="icon-button" aria-label="Close preview" title="Close preview" onClick={close} autoFocus><X/></button></div></div><div className={`dialog-image-area ${zoomed?'is-zoomed':''}`}><img id="dialog-image" src={screen.image} width="1440" height="900" alt={`Full-resolution ${screen.caption}`}/></div></dialog>;
}

export default function App(){
  const reduced=useReducedMotion();
  const {scrollY,scrollYProgress}=useScroll();
  const [preview,setPreview]=useState(null),[toast,setToast]=useState('');
  const timer=useRef(null);
  const notify=message=>{clearTimeout(timer.current);setToast(message);timer.current=setTimeout(()=>setToast(''),2800);};
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const onPreview=(screen,returnFocus)=>setPreview({screen,returnFocus});
  return <MotionConfig reducedMotion="user"><Loader/><Navbar progress={scrollYProgress} {...{scrollY,reduced}}/><VelocityGrid {...{scrollY,reduced}}/><MediaCursor {...{scrollY,reduced}}/><main id="main"><Hero {...{onPreview,reduced}}/><Statement reduced={reduced}/><Showcase {...{onPreview,reduced}}/><MediaReveal {...{onPreview,reduced}}/><InteractivePreview/><DownloadSection {...{notify,reduced}}/></main><Footer reduced={reduced}/>{preview&&<Lightbox {...preview} close={()=>setPreview(null)}/>}<AnimatePresence>{toast&&<motion.div className="toast" role="status" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:10}}>{toast}</motion.div>}</AnimatePresence></MotionConfig>;
}
