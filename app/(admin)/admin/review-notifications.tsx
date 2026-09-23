"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {studioRequest,type ReviewInbox} from "@/features/admin";
import s from "./studio.module.css";
export function AdminReviewLink() { const [count, setCount] = useState(0); useEffect(() => { const load = () => studioRequest<ReviewInbox>('/reviews').then(d => setCount(d.notifications.filter(n => !n.read_at).length)).catch(() => { }); void load(); const timer = setInterval(() => void load(), 30000); return () => clearInterval(timer); }, []); return <Link href="/admin/reviews">Review inbox {count > 0 && <span className={s.badge}>{count}</span>} →</Link>; }
