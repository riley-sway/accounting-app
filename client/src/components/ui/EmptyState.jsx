export default function EmptyState({ icon = 'inbox', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span
        className="material-symbols-outlined mb-4"
        style={{ fontSize: '48px', color: '#c6c6cd' }}
      >
        {icon}
      </span>
      <h3
        className="text-lg font-bold mb-2"
        style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--text-primary)' }}
      >
        {title}
      </h3>
      {description && (
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)', maxWidth: '320px' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  )
}
