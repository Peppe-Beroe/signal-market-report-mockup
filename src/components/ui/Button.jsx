export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  title,
}) {
  const base = 'inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-400 shadow-sm',
    secondary: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-300 shadow-sm',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-300',
    'danger-outline': 'border border-red-300 text-red-600 hover:bg-red-50 focus:ring-red-200',
    success: 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-300',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-200',
    link: 'text-purple-600 hover:text-purple-800 underline-offset-2 hover:underline',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  // Use inline style for primary to ensure brand purple renders correctly with Tailwind v4
  const isPrimary = variant === 'primary';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      style={isPrimary && !disabled ? { backgroundColor: '#4A00F8' } : undefined}
    >
      {children}
    </button>
  );
}
