export default function Card({ children, className = '', onClick, hover = false }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-100 shadow-sm ${hover ? 'cursor-pointer hover:shadow-md hover:border-purple-200 transition-all duration-150' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
