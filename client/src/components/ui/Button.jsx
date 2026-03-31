export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-bold uppercase tracking-widest transition-all rounded disabled:opacity-50 disabled:cursor-not-allowed'

  const sizes = {
    sm: 'text-[10px] px-4 py-2',
    md: 'text-xs px-5 py-3',
    lg: 'text-xs px-6 py-3.5',
  }

  const variants = {
    primary: 'bg-slate-950 text-white hover:bg-slate-800',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      style={{ fontFamily: 'Manrope, sans-serif' }}
      {...props}
    >
      {children}
    </button>
  )
}
