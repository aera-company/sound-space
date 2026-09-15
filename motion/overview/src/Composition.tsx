import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const ink='#331c52', purple='#8e45f6', blue='#86d4fb';
const cells=[
 {id:'B',name:'Warm + slow',date:'Tue, 18 Aug',n:25,x:32,y:208,warm:true},
 {id:'A',name:'Warm + fast',date:'Wed, 19 Aug',n:37,x:652,y:208,warm:true},
 {id:'D',name:'Cool + slow',date:'Thu, 20 Aug',n:30,x:32,y:634,warm:false},
 {id:'C',name:'Cool + fast',date:'Fri, 21 Aug',n:36,x:652,y:634,warm:false},
];
export const OverviewArtwork=({frame,fps}:{frame:number;fps:number})=>{
 const ease=Easing.bezier(.23,1,.32,1);
 return <svg viewBox="0 0 1280 1120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{fontFamily:'Arial, Helvetica, sans-serif'}}>
   <rect width="1280" height="1120" fill="#fff"/>
   <text x="32" y="65" fill={ink} fontSize="47" fontWeight="600">Colour temperature × music tempo</text>
   <line x1="32" x2="1248" y1="99" y2="99" stroke="#ded4e8" strokeWidth="2"/>
   {[{x:330,bpm:68,label:'Slow music'},{x:950,bpm:118,label:'Fast music'}].map(c=><g key={c.bpm}>
    <text x={c.x} y="166" fill={ink} fontSize="47" textAnchor="middle"><tspan fontWeight="600">{c.bpm} BPM</tspan><tspan dx="20" fontSize="35">{c.label}</tspan></text>
   </g>)}
   {cells.map((c,i)=>{
    const start=(.5+i*1.35)*fps;
    const enter=interpolate(frame,[start,start+.3*fps],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:ease});
    const exit=interpolate(frame,[start+1.05*fps,start+1.35*fps],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:ease});
    const highlight=enter-exit;
    const sweep=interpolate(frame,[start,start+1.15*fps],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:ease});
    return <g key={c.id} transform={`translate(${c.x},${c.y})`}>
     <rect width="596" height="394" rx="14" fill={c.warm?'#f4edfd':'#edf8fe'}/>
     <rect x="3" y="3" width="590" height="388" rx="12" fill="none" stroke={purple} strokeWidth="5" opacity={highlight}/>
     <text x="34" y="77" fontSize="49" fill={ink} fontWeight="500">{c.name}</text>
     <text x="553" y="73" fontSize="31" fill="#706079" textAnchor="end">{c.id}</text>
     <text x="34" y="223" fill={ink} fontSize="118" fontFamily="Georgia, serif">{c.n}</text>
     <text x="211" y="213" fill={ink} fontSize="44">respondents</text>
     <line x1="34" x2="562" y1="265" y2="265" stroke={c.warm?'#d7bdfa':'#b8dceb'} strokeWidth="2"/>
     <line x1="34" x2={34+528*sweep} y1="265" y2="265" stroke={c.warm?purple:blue} strokeWidth="5" opacity={highlight}/>
     <text x="34" y="339" fill={ink} fontSize="48">{c.date}</text>
     <circle cx="550" cy="325" r="10" fill={c.warm?purple:blue} opacity={.35+.65*highlight}/>
    </g>;
   })}
   <text x="32" y="1100" fill="#64576e" fontSize="31">128 respondents · four combined conditions</text>
   <text x="1248" y="1100" textAnchor="end" fill="#64576e" fontSize="31">August 2026</text>
  </svg>;
};

export const OverviewComposition=()=>{const frame=useCurrentFrame();const {fps}=useVideoConfig();return <AbsoluteFill style={{background:"#fff"}}><OverviewArtwork frame={frame} fps={fps}/></AbsoluteFill>;};
