export function PanelHeading({ eyebrow, title, tag }) {
  return <div className="flex items-start justify-between gap-4">
    <div><p className="eyebrow mb-1.5">{eyebrow}</p><h2 className="text-lg font-bold leading-tight">{title}</h2></div>
    {tag && <span className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 font-mono text-[10px] font-medium text-blue-700">{tag}</span>}
  </div>;
}
