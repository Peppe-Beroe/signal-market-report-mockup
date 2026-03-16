export default function Badge({ children, color = 'purple', size = 'sm' }) {
  const colors = {
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
    gray: 'bg-gray-100 text-gray-600',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    navy: 'bg-blue-50 text-blue-800',
  };
  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };
  return (
    <span className={`inline-flex items-center rounded-md font-medium ${colors[color]} ${sizes[size]}`}>
      {children}
    </span>
  );
}
