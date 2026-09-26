"use client";
import { useEffect, useState } from "react";
const messages = ["A new chapter in everyday dressing", "The AURELIA collection is coming soon", "Thoughtfully styled for every occasion"];
export function AnnouncementBar() { const [index,setIndex] = useState(0); useEffect(() => { const timer = window.setInterval(() => setIndex(i => (i+1) % messages.length), 5000); return () => window.clearInterval(timer); }, []); return <div className="announcement" role="status" aria-live="off">{messages[index]}</div>; }
