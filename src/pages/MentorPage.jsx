import { useMentorFeedback } from '../hooks/useMentorFeedback';
export default function MentorPage() { const items = useMentorFeedback(); return <div className="space-y-4"><div className="headline-lg">AI Mentor</div>{items.map((item)=><div key={item.id} className="glass-card p-4"><div className="text-sm text-white/75">{item.feedback}</div></div>)}</div>; }
