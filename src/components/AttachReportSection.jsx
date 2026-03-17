import { useState } from 'react';
import { Paperclip, Share2, CheckCircle } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';

export function AttachReportSection({ surveyId, attachReport, shareReport, addToast, responsesReceived, survey }) {
  const [attachedFile, setAttachedFile] = useState(survey?.attachedReport?.fileName || null);
  const [shared, setShared] = useState(!!(survey?.reportSharedAt));

  const handleAttach = () => {
    const fileName = 'Market_Intelligence_Report.pdf';
    setAttachedFile(fileName);
    if (attachReport && surveyId) {
      attachReport(surveyId, fileName);
    } else {
      addToast && addToast('Report attached successfully');
    }
  };

  const handleShare = () => {
    setShared(true);
    if (shareReport && surveyId) {
      shareReport(surveyId, responsesReceived);
    } else {
      addToast && addToast(`Report shared with ${responsesReceived} experts who responded`);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Paperclip size={15} className="text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-800">Attach Market Intelligence Report</h3>
      </div>
      {!attachedFile ? (
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500 flex-1">Attach the final research report PDF to share with respondents.</p>
          <Button variant="secondary" size="sm" onClick={handleAttach}>
            <Paperclip size={13} /> Attach PDF
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
          <div className="w-9 h-9 rounded-lg bg-white border border-green-200 flex items-center justify-center flex-shrink-0">
            <Paperclip size={16} className="text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{attachedFile}</p>
            <p className="text-xs text-gray-400">PDF · Attached</p>
          </div>
          {!shared ? (
            <Button size="sm" onClick={handleShare}>
              <Share2 size={13} /> Share with {responsesReceived} respondents
            </Button>
          ) : (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle size={13} /> Shared
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

export default AttachReportSection;
