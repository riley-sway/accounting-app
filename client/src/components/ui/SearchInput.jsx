export default function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <span
        className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]"
        style={{ color: 'var(--text-secondary)' }}
      >
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-4 py-2 text-sm rounded-lg w-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
        style={{ fontFamily: 'Inter, sans-serif' }}
      />
    </div>
  )
}
