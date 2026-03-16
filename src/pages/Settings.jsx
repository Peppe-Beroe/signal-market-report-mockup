import { Settings as SettingsIcon } from 'lucide-react';
import Card from '../components/ui/Card';

export default function Settings() {
  return (
    <div className="p-6 max-w-4xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Platform configuration and administration</p>
      </div>
      <Card className="p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <SettingsIcon size={22} className="text-gray-400" />
        </div>
        <p className="text-gray-600 font-semibold text-base mb-1">Settings panel</p>
        <p className="text-sm text-gray-400">Platform settings, user management, and integrations are coming in the next release.</p>
      </Card>
    </div>
  );
}
