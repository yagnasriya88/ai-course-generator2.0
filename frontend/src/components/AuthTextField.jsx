function AuthTextField({ label, type = 'text', value, onChange, autoComplete, required, minLength }) {
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
      />
    </label>
  )
}

export default AuthTextField
