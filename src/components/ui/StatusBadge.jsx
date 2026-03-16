export default function StatusBadge({ status, size = 'sm' }) {
  const config = {
    Draft: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', pulse: false },
    Submitted: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', pulse: true },
    Approved: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', pulse: false },
    Running: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', pulse: true },
    Closed: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', pulse: false },
    Review: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', pulse: false },
    Transferred: { bg: 'bg-blue-50', text: 'text-blue-800', dot: 'bg-blue-600', pulse: false },
    Active: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', pulse: false },
    'Opted-out': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', pulse: false },
  };

  const c = config[status] || config['Draft'];
  const px = size === 'xs' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${px} ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot} ${c.pulse ? 'pulse-dot' : ''}`} />
      {status}
    </span>
  );
}
