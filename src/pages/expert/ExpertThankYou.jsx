import { useNavigate, useParams } from 'react-router-dom';
import { Zap, BarChart2 } from 'lucide-react';

function CheckmarkSVG() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="36" cy="36" r="36" fill="#D1FAE5" />
      <circle cx="36" cy="36" r="28" fill="#10B981" />
      <path
        d="M22 36L31 45L50 26"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ExpertThankYou() {
  const navigate = useNavigate();
  const { token } = useParams();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shadow"
          style={{ backgroundColor: '#4A00F8' }}
        >
          <Zap size={17} className="text-white" fill="white" />
        </div>
        <div>
          <span className="font-bold text-gray-900 text-lg">Beroe</span>
          <span className="font-light text-gray-400 text-lg ml-1">Signal</span>
        </div>
      </div>

      {/* Card */}
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <CheckmarkSVG />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">Thank you for your response!</h1>

        <p className="text-sm text-gray-600 leading-relaxed mb-5">
          Your answers have been recorded for the{' '}
          <strong>Steel Price Outlook</strong> survey.
          As a thank-you, Beroe will share the final Signal Market Report once it is published.
        </p>

        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6 text-left space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Survey</span>
            <span className="font-medium text-gray-800">Steel Price Outlook</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Submitted by</span>
            <span className="font-medium text-gray-800">Dr. James Wright</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Date</span>
            <span className="font-medium text-gray-800">2026-03-11</span>
          </div>
        </div>

        {/* View results CTA */}
        <button
          onClick={() => navigate(`/survey/${token}/results${token === 'demo-closed' ? '?state=closed' : ''}`)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 shadow-sm mb-3"
          style={{ backgroundColor: '#4A00F8' }}
        >
          <BarChart2 size={16} />
          {token === 'demo-closed' ? 'View final results & download report' : 'View live results'}
        </button>

        <p className="text-xs text-gray-400 mb-3">
          {token === 'demo-closed'
            ? 'The survey has closed — download the final Signal Market Report.'
            : 'See how other experts responded — results are updated in real time.'}
        </p>

        {token !== 'demo-closed' && (
          <p className="text-xs text-gray-400 mb-6 italic">
            We'll also send you an email notification when the survey closes so you can return at any time.
          </p>
        )}

        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          ← Back to platform (demo)
        </button>
      </div>

      <p className="text-xs text-gray-300 mt-10">
        © 2026 Beroe Inc. · Signal Market Report Platform · Confidential
      </p>
    </div>
  );
}
