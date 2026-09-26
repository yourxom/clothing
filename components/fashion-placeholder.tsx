type Tone = "rose"|"olive"|"blue"|"clay"|"sand"|"plum";
export function FashionPlaceholder({label,tone="sand",className=""}:{label:string;tone?:Tone;className?:string}) {return <div role="img" aria-label={`${label} — original fashion photography coming soon`} className={`visual visual--${tone} ${className}`}><span className="placeholder-caption">{label}</span></div>;}
