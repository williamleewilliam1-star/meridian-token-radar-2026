/** MERIDIAN: deterministic, snapshot-only peer valuation and action research. */
export interface Protocol { slug:string; name:string; category:string|null; chains:string[]; tvl_usd:number; change_7d:number|null; mcap_usd:number|null; listed_at:string|null; gecko_id:string|null; symbol:string|null }
export interface Snapshot { as_of:string; source:string; floor_usd:number; protocols:Protocol[]; watchlist:string[] }
export interface Peer { category:string; count:number; ratio:number; raw_median:number; global_median:number }
export interface Row extends Protocol { rank:number; implied_value_usd:number; value_low_usd:number; value_high_usd:number; age_days:number|null; confidence:'Higher'|'Moderate'|'Exploratory'; token_status:'No token recorded'; model:{baseline_ratio:number; peer_count:number; category_median:number; global_median:number; momentum_factor:number; maturity_factor:number; breadth_factor:number; confidence_factor:number; formula:string}; farm_steps:string[] }
export const excludedCategories=new Set(['Bridge','Canonical Bridge','Cross Chain Bridge','Liquid Staking','Liquid Restaking','Restaked BTC','CEX','Stablecoin Wrapper','Staking Pool','Token Locker']);
const derivative=/\b(wrapped|staked|staking|bridged|bridge|restaked)\b|\s(?:v\d+(?:\.\d+)?|\d+\.\d+)$/i;
const exchange=/^(Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)\b/i;
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const round=(x:number,n=4)=>Math.round(x*10**n)/10**n;
const median=(a:number[])=>{const b=[...a].sort((x,y)=>x-y);return b.length?(b[Math.floor((b.length-1)/2)]!+b[Math.floor(b.length/2)]!)/2:0};
export function ageDays(asOf:string,listed:string|null):number|null { if(!listed)return null;const a=Date.parse(asOf+'T00:00:00Z'),b=Date.parse(listed+'T00:00:00Z');return Number.isFinite(a)&&Number.isFinite(b)?Math.max(0,Math.floor((a-b)/86400000)):null }
export function tokenRecorded(p:Protocol):boolean {return p.gecko_id!==null||p.symbol!==null||p.mcap_usd!==null}
export function eligible(p:Protocol):boolean {return !tokenRecorded(p)&&!excludedCategories.has(p.category??'')&&!derivative.test(p.name)&&!exchange.test(p.name)}
/** Robust comparable cohorts: trim ratios by global 10th/90th percentiles, then shrink category median toward global. */
export function calibrate(s:Snapshot):{global:number;peers:Map<string,Peer>;comparable_count:number}{
 const comps=s.protocols.filter(p=>tokenRecorded(p)&&p.mcap_usd!==null&&p.mcap_usd>0&&p.tvl_usd>=5e6&&!excludedCategories.has(p.category??''));
 const ratios=comps.map(p=>p.mcap_usd!/p.tvl_usd).filter(x=>Number.isFinite(x)&&x>0).sort((a,b)=>a-b);
 if(ratios.length<10)throw Error('Insufficient token-bearing comparables');
 const lo=ratios[Math.floor(ratios.length*.1)]!,hi=ratios[Math.floor(ratios.length*.9)]!;
 const clean=comps.filter(p=>{const r=p.mcap_usd!/p.tvl_usd;return r>=lo&&r<=hi});
 const global=median(clean.map(p=>p.mcap_usd!/p.tvl_usd));
 const groups=new Map<string,number[]>();for(const p of clean){const k=p.category??'Unclassified';if(!groups.has(k))groups.set(k,[]);groups.get(k)!.push(p.mcap_usd!/p.tvl_usd)}
 const peers=new Map<string,Peer>();for(const [category,values] of groups){const raw=median(values),n=values.length;peers.set(category,{category,count:n,raw_median:round(raw),global_median:round(global),ratio:round((n*raw+8*global)/(n+8))})}
 return {global:round(global),peers,comparable_count:clean.length}
}
const gas=(chain:string)=>/Ethereum|Bitcoin/.test(chain)?'$5–25':'$0.10–3';
/** Conditional research actions, not a claim that a reward program exists. */
export function farmSteps(p:Protocol):string[]{
 const c=(p.category??'').toLowerCase(),chain=p.chains[0]??'the listed chain',fee=gas(chain);
 let act='Try a small, reversible deposit or core app action';let risk='Smart contract loss and asset depegs are possible';
 if(/lending|collateral|cdp/.test(c)){act='Supply a small stablecoin amount, inspect collateral and borrow limits, and avoid liquidation exposure';risk='Borrowing can liquidate collateral; supplying alone is safer but still carries contract risk'}
 else if(/dex|liquidity|yield|farm/.test(c)){act='Make one small swap or provide a small amount of balanced liquidity if a suitable pool exists';risk='Liquidity provision can lose value through price divergence and contract failure'}
 else if(/derivative|perpetual|basis|options/.test(c)){act='Inspect paper-trading or small unlevered participation first; use margin only if losses are affordable';risk='Derivatives can rapidly lose the full margin; funding and spreads add costs'}
 else if(/rwa|ceDeFi|capital allocator|curator|vault/.test(c)){act='Check eligibility and redemption terms, then consider a small vault deposit only if access is permitted';risk='Custody, redemption gates, and counterparty failure may prevent exit'}
 else if(/prediction/.test(c)){act='Inspect market resolution rules, then consider a single small position only if legally available';risk='A wrong outcome can lose the full stake; resolution and jurisdiction matter'}
 else if(/restaking/.test(c)){act='Review the restaking terms and exit queue before considering a small position';risk='Slashing, lockups, and receipt-token depegs may prevent timely exit'}
 return [
 `Research ${p.name} on ${chain}: independently verify the official app and contracts before connecting a wallet. Time: 10 minutes. Estimated fee: $0; links and eligibility can change.`,
 `Check ${p.category??'the protocol'} documentation for active points, tasks, or governance; record the terms and snapshot date. Time: 15 minutes. Estimated fee: $0; no reward is assumed.`,
 `${act} on ${chain}, only after checking minimums and contract risk. Time: 15–30 minutes. Estimated network fee: ${fee} plus any quoted swap or protocol fee; start small.`,
 `Revisit the position once a week for four weeks; log transaction IDs and any actual points shown by the app. Time: 10 minutes weekly. Estimated fee: $0 unless you choose an action.`,
 `Review exposure and unwind through the verified app when appropriate. Time: 15 minutes. Estimated network fee: ${fee} plus any exit fee. ${risk}; a token or airdrop is never guaranteed.`
 ]
}
export function buildRadar(s:Snapshot){
 const calibration=calibrate(s),watch=new Set(s.watchlist);
 const chosen=s.protocols.filter(p=>eligible(p)||watch.has(p.slug));
 if(chosen.length<100)throw Error('Too few eligible records');
 const rows:Row[]=chosen.map(p=>{
  if(tokenRecorded(p))throw Error('Watchlist contains a token-bearing record: '+p.slug);
  const peer=calibration.peers.get(p.category??'Unclassified'),ratio=peer?.ratio??calibration.global,age=ageDays(s.as_of,p.listed_at);
  const growth=p.change_7d===null?0:clamp(p.change_7d,-35,35);
  const momentum=clamp(1+Math.sign(growth)*Math.log1p(Math.abs(growth))/14,.75,1.25);
  const maturity=age===null?.82:clamp(.7+.3*Math.log1p(age)/Math.log1p(1095),.7,1);
  const breadth=clamp(1+.035*Math.log2(Math.max(1,p.chains.length)),1,1.15);
  const confidence=peer&&peer.count>=8&&age!==null&&p.change_7d!==null?'Higher':peer&&peer.count>=3?'Moderate':'Exploratory';
  const confFactor=confidence==='Higher'?1:confidence==='Moderate'?.92:.82;
  const base=Math.max(1,Math.round(p.tvl_usd*ratio*momentum*maturity*breadth*confFactor));
  const spread=confidence==='Higher'?.42:confidence==='Moderate'?.55:.68;
  return {...p,rank:0,implied_value_usd:base,value_low_usd:Math.max(1,Math.round(base*(1-spread))),value_high_usd:Math.round(base*(1+spread)),age_days:age,confidence,token_status:'No token recorded' as const,model:{baseline_ratio:ratio,peer_count:peer?.count??0,category_median:peer?.raw_median??calibration.global,global_median:calibration.global,momentum_factor:round(momentum),maturity_factor:round(maturity),breadth_factor:round(breadth),confidence_factor:confFactor,formula:'TVL × shrunk peer MCAP/TVL × momentum × maturity × chain breadth × confidence'},farm_steps:farmSteps(p)};
 });
 rows.sort((a,b)=>b.implied_value_usd-a.implied_value_usd||a.slug.localeCompare(b.slug));rows.forEach((r,i)=>r.rank=i+1);
 return {board:rows,radar:{as_of:s.as_of,source:s.source,watchlist_size:s.watchlist.length,comparable_count:calibration.comparable_count,global_ratio:calibration.global,rows}};
}
export function parseSnapshot(text:string):Snapshot {const s=JSON.parse(text) as Snapshot;if(!/^\d{4}-\d{2}-\d{2}$/.test(s.as_of)||!Array.isArray(s.protocols)||!Array.isArray(s.watchlist))throw Error('Invalid snapshot');return s}
export function boardIssue(rows:Row[],s:Snapshot):string|null {const slugs=new Set(rows.map(r=>r.slug));if(rows.length<100||slugs.size!==rows.length)return 'Count or duplicate slugs';if(s.watchlist.some(x=>!slugs.has(x)))return 'Watchlist coverage';for(let i=0;i<rows.length;i++){const r=rows[i]!;if(r.rank!==i+1||r.implied_value_usd<=0||i&&r.implied_value_usd>rows[i-1]!.implied_value_usd)return 'Rank or value';if(tokenRecorded(r)||r.farm_steps.length<3||r.farm_steps.some(x=>x.length<20||x.length>600))return 'Token status or steps'}return null}
export function dataScript(radar:ReturnType<typeof buildRadar>['radar']):string {return 'window.MERIDIAN='+JSON.stringify(radar)+';\n'}
