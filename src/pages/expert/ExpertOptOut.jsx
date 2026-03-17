import { CheckCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';

export default function ExpertOptOut() {
  const { token } = useParams();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-5 py-12">
      <div className="max-w-md w-full text-center">
        {/* Beroe logo */}
        <div className="mb-8">
          <img src="/BeroeLogo.svg" alt="Beroe" style={{ height: '24px', width: 'auto', margin: '0 auto' }} />
        </div>

        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">You have been unsubscribed</h1>
        <p className="text-sm text-gray-500 mb-6">
          You will no longer receive survey invitations from Beroe Signal. Your response to any active surveys has been noted as opted-out.
        </p>

        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-left mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">What this means</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              <span>You will not receive any future survey invitations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              <span>Your opt-out has been recorded with a timestamp</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">&#10003;</span>
              <span>You can contact us to be re-added to the panel at any time</span>
            </li>
          </ul>
        </div>

        <p className="text-xs text-gray-400">
          If you unsubscribed by mistake, please contact{' '}
          <span className="text-purple-600 underline underline-offset-2 cursor-pointer">research@beroe-inc.com</span>
        </p>
      </div>
    </div>
  );
}
