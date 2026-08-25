export type TimeBlock={startMinutes:number;endMinutes:number};
export type Slot={time:string;startMinutes:number;endMinutes:number;available:boolean;last?:boolean};
const toTime=(minutes:number)=>`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
export function overlaps(a:TimeBlock,b:TimeBlock){return a.startMinutes<b.endMinutes&&b.startMinutes<a.endMinutes}
export function generateSlots({working,breaks=[],booked=[],durationMinutes,gridMinutes=15,bufferMinutes=5,minStartMinutes=0}:{working:TimeBlock[];breaks?:TimeBlock[];booked?:TimeBlock[];durationMinutes:number;gridMinutes?:number;bufferMinutes?:number;minStartMinutes?:number}){
 const slots:Slot[]=[];
 for(const range of working){let cursor=Math.ceil(Math.max(range.startMinutes,minStartMinutes)/gridMinutes)*gridMinutes;while(cursor+durationMinutes<=range.endMinutes){const candidate={startMinutes:cursor,endMinutes:cursor+durationMinutes};const blocked=breaks.some(x=>overlaps(candidate,x))||booked.some(x=>overlaps({startMinutes:candidate.startMinutes-bufferMinutes,endMinutes:candidate.endMinutes+bufferMinutes},x));slots.push({...candidate,time:toTime(cursor),available:!blocked});cursor+=gridMinutes}}
 const available=slots.filter(x=>x.available);if(available.length)available[available.length-1].last=true;return slots;
}
export function createReference(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let out='HLQ-';for(let i=0;i<4;i++)out+=alphabet[Math.floor(Math.random()*alphabet.length)];return out}
