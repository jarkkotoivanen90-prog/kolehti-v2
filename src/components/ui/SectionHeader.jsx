export default function SectionHeader({ eyebrow, title, subtitle, right }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow ? <div className="section-title">{eyebrow}</div> : null}
        <div className="headline-lg mt-1">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-white/65 max-w-2xl">{subtitle}</div> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
