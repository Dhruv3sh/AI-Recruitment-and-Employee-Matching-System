import { ArrowDown, BrainCircuit, BriefcaseBusiness, FileText, UserRound } from "lucide-react";

const stages = [
  { code: "D1", title: "Candidate profile", text: "Skills, education, experience, and role preferences.", Icon: UserRound, color: "bg-blue-50 text-blue-600 border-blue-100" },
  { code: "D2", title: "Resume processing", text: "Documents are parsed into searchable candidate signals.", Icon: FileText, color: "bg-cyan-50 text-cyan-600 border-cyan-100" },
  { code: "D3", title: "Job requirements", text: "Recruiters create structured role requirements.", Icon: BriefcaseBusiness, color: "bg-violet-50 text-violet-600 border-violet-100" },
  { code: "D4", title: "AI matching", text: "Explainable matching ranks relevant opportunities.", Icon: BrainCircuit, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
];

export default function SystemMapPage() {
  return (
    <section>
      <p className="-mt-8 max-w-2xl text-sm leading-relaxed text-[#617da4]">Matchwise turns profile and role information into explainable recommendations while leaving decisions with people.</p>
      <div className="mt-8 grid gap-4 lg:grid-cols-4">
        {stages.map(({ code, title, text, Icon, color }, index) => (
          <div key={code} className="relative">
            <article className="panel min-h-52 p-5">
              <div className="flex items-start justify-between"><span className={`grid h-10 w-10 place-items-center rounded-[9px] border ${color}`}><Icon size={20} /></span><span className="rounded-lg bg-[#f1f6ff] px-2 py-1 font-mono text-[10px] text-brand">{code}</span></div>
              <h2 className="mt-7 text-base font-extrabold text-[#112c5a]">{title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-[#607da2]">{text}</p>
            </article>
            {index < stages.length - 1 ? <ArrowDown className="mx-auto my-2 text-[#8ba4c4] lg:absolute lg:-right-5 lg:top-1/2 lg:my-0 lg:-translate-y-1/2 lg:-rotate-90" size={18} /> : null}
          </div>
        ))}
      </div>
      <section className="panel mt-8 p-6 sm:p-7">
        <p className="eyebrow mb-2">Matching signals</p>
        <h2 className="text-xl font-extrabold">Every recommendation has a reason.</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {["Skills overlap", "Relevant experience", "Education signal"].map((label, index) => (
            <div key={label} className="rounded-[9px] border border-[#dce7f3] bg-[#f8fbff] p-4"><span className="font-mono text-xl font-medium text-brand">{[60, 25, 15][index]}%</span><strong className="mt-3 block text-sm">{label}</strong><p className="mt-1 text-xs leading-relaxed text-[#617da4]">A clear input to the match score, available for review.</p></div>
          ))}
        </div>
      </section>
    </section>
  );
}
