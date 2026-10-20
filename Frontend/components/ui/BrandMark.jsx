import Link from "next/link";

export function BrandMark({ href = "/candidate", dark = false }) {
  return <Link href={href} className={`flex items-center gap-2 text-xl font-extrabold ${dark ? "text-white" : "text-ink"}`}>
    <span className="flex h-6 items-end gap-1" aria-hidden="true"><i className="h-2.5 w-1 rounded-sm bg-[#24c7e5]" /><i className="h-4 w-1 rounded-sm bg-[#0bb88a]" /><i className="h-6 w-1 rounded-sm bg-[#087765]" /></span>
    <span className={dark ? "text-white" : "text-slate-950"}>matchwise</span>
  </Link>;
}
