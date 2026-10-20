export function Field({ label, hint, full = false, children }) {
  return <label className={`form-label ${full ? "col-span-full" : ""}`}>
    <span>{label}{hint && <small className="ml-1 field-hint">{hint}</small>}</span>
    {children}
  </label>;
}
