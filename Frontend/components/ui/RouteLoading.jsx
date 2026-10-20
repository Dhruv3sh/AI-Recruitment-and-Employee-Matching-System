export function RouteLoading({ label = "Loading desk..." }) {
  return (
    <section className="grid min-h-64 place-items-center pt-7">
      <p className="font-mono text-xs text-slate-500">{label}</p>
    </section>
  );
}
