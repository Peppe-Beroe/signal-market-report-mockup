import { useParams, useSearchParams } from 'react-router-dom';
import { Download, Lock, CheckCircle, Mail, PenLine } from 'lucide-react';
import { SURVEYS } from '../../data/mockData';

const DEMO_SURVEY = SURVEYS[0];

// Compute aggregates from mock responses
function computeAggregates(survey) {
  const responses = survey.responses || [];
  const total = responses.length;
  const result = {};

  survey.questions.forEach(q => {
    if (q.type === 'single_choice') {
      const counts = {};
      q.options.forEach(opt => { counts[opt] = 0; });
      responses.forEach(r => {
        if (r.answers[q.id]) counts[r.answers[q.id]] = (counts[r.answers[q.id]] || 0) + 1;
      });
      result[q.id] = { type: 'single_choice', counts, total };

    } else if (q.type === 'multi_choice') {
      const counts = {};
      q.options.forEach(opt => { counts[opt] = 0; });
      responses.forEach(r => {
        const ans = r.answers[q.id] || [];
        ans.forEach(opt => { counts[opt] = (counts[opt] || 0) + 1; });
      });
      result[q.id] = { type: 'multi_choice', counts, total };

    } else if (q.type === 'rating_scale') {
      const values = responses.map(r => r.answers[q.id]).filter(Boolean);
      const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const counts = {};
      for (let i = 1; i <= q.scale; i++) counts[i] = 0;
      values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
      result[q.id] = { type: 'rating_scale', avg, counts, total: values.length, scale: q.scale };

    } else if (q.type === 'open_text') {
      const verbatims = responses
        .map((r, i) => ({ index: i + 1, text: r.answers[q.id] }))
        .filter(v => v.text);
      result[q.id] = { type: 'open_text', verbatims };
    }
  });

  return result;
}

function ChoiceBar({ label, count, total, maxCount }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-700 leading-tight pr-4">{label}</span>
        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap flex-shrink-0">
          {count} <span className="text-gray-400 font-normal text-xs">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${barWidth}%`, backgroundColor: '#4A00F8' }}
        />
      </div>
    </div>
  );
}

function RatingDisplay({ avg, counts, scale, labels }) {
  const maxCount = Math.max(...Object.values(counts), 1);

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-5">
        <span className="text-4xl font-bold" style={{ color: '#4A00F8' }}>{avg.toFixed(1)}</span>
        <span className="text-gray-400 text-sm">/ {scale} average</span>
      </div>
      <div className="flex items-end gap-2" style={{ height: '64px' }}>
        {Array.from({ length: scale }, (_, i) => i + 1).map(n => {
          const count = counts[n] || 0;
          const heightPct = (count / maxCount) * 100;
          return (
            <div key={n} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end" style={{ height: '48px' }}>
                <div
                  className="w-full rounded-t-md transition-all duration-700"
                  style={{
                    height: count > 0 ? `${Math.max(heightPct, 8)}%` : '2px',
                    backgroundColor: '#4A00F8',
                    opacity: 0.45 + (n / scale) * 0.55,
                  }}
                />
              </div>
              <span className="text-xs text-gray-400">{n}</span>
            </div>
          );
        })}
      </div>
      {labels && (
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
        </div>
      )}
    </div>
  );
}

export default function ExpertResultsHub() {
  const { token } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const isClosed = searchParams.get('state') === 'closed' || token === 'demo-closed';
  // Demo: simulate "edited by Beroe research team" when ?edited=true is in the URL
  const isEdited = searchParams.get('edited') === 'true';

  const survey = DEMO_SURVEY;
  const aggregates = computeAggregates(survey);
  const responseCount = survey.responses.length;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-5 h-12 max-w-lg mx-auto">
          <img src="/BeroeLogo.svg" alt="Beroe" style={{ height: '20px', width: 'auto' }} />
          <span className="text-xs text-gray-400 hidden sm:block">Confidential — for research purposes only</span>
        </div>
      </div>

      {/* Demo toggle */}
      <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <span className="text-xs text-amber-700 font-medium">Demo — toggle state:</span>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setSearchParams({})}
              className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${
                !isClosed ? 'bg-amber-500 text-white' : 'bg-white text-amber-600 border border-amber-300 hover:bg-amber-50'
              }`}
            >
              Running
            </button>
            <button
              onClick={() => setSearchParams({ state: 'closed' })}
              className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${
                isClosed ? 'bg-green-500 text-white' : 'bg-white text-green-700 border border-green-300 hover:bg-green-50'
              }`}
            >
              Closed
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6">

        {/* Results curation banner — shown only after Admin override (P1-F-98) */}
        {isEdited && isClosed && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-3 text-xs text-blue-700">
            <PenLine size={13} className="text-blue-500 flex-shrink-0" />
            <span>Results last updated 2026-04-02 — <strong>edited by Beroe research team</strong></span>
          </div>
        )}

        {/* Status banner */}
        {!isClosed ? (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-5">
            <div className="relative flex-shrink-0 mt-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping opacity-75" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">Survey is running</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                {responseCount} {responseCount === 1 ? 'response' : 'responses'} collected so far.
                Results will update as more experts respond.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3.5 mb-5">
            <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Survey closed — final results</p>
              <p className="text-xs text-green-700 mt-0.5 leading-relaxed">
                {responseCount} final {responseCount === 1 ? 'response' : 'responses'}. No further changes will be made.
              </p>
            </div>
          </div>
        )}

        {/* Survey header */}
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#4A00F8' }}>
            Survey Results
          </p>
          <h1 className="text-xl font-bold text-gray-900">{survey.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Wave {survey.wave} · {survey.category}</p>
        </div>

        {/* Question results */}
        {survey.questions.map((q, idx) => {
          const agg = aggregates[q.id];
          if (!agg) return null;

          return (
            <div key={q.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Question {idx + 1}
              </p>
              <p className="text-sm font-semibold text-gray-900 mb-4 leading-snug">{q.text}</p>

              {(agg.type === 'single_choice' || agg.type === 'multi_choice') && (() => {
                const maxCount = Math.max(...Object.values(agg.counts), 1);
                return (
                  <div>
                    {agg.type === 'multi_choice' && (
                      <p className="text-xs text-gray-400 mb-3">Multiple selections allowed</p>
                    )}
                    {q.options.map(opt => (
                      <ChoiceBar
                        key={opt}
                        label={opt}
                        count={agg.counts[opt] || 0}
                        total={agg.type === 'single_choice' ? agg.total : agg.total}
                        maxCount={maxCount}
                      />
                    ))}
                    <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
                      {agg.total} {agg.total === 1 ? 'response' : 'responses'}
                    </p>
                  </div>
                );
              })()}

              {agg.type === 'rating_scale' && (
                <div>
                  <RatingDisplay
                    avg={agg.avg}
                    counts={agg.counts}
                    scale={q.scale}
                    labels={q.labels}
                  />
                  <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
                    {agg.total} {agg.total === 1 ? 'response' : 'responses'}
                  </p>
                </div>
              )}

              {agg.type === 'open_text' && (
                <div>
                  {agg.verbatims.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No responses yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {agg.verbatims.map(v => (
                        <div key={v.index} className="bg-gray-50 rounded-lg px-4 py-3">
                          <p className="text-xs font-semibold text-gray-400 mb-1">Response {v.index}</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{v.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
                    {agg.verbatims.length} {agg.verbatims.length === 1 ? 'response' : 'responses'}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Report download section */}
        <div
          className={`rounded-xl border-2 p-5 mb-4 ${
            isClosed ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isClosed ? 'bg-purple-100' : 'bg-gray-100'
              }`}
            >
              {isClosed
                ? <Download size={22} style={{ color: '#4A00F8' }} />
                : <Lock size={22} className="text-gray-400" />
              }
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">Final Signal Market Report</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {isClosed
                  ? 'The Beroe research team has published the final report for this wave. Download your copy below.'
                  : 'The final report will be published once the survey closes and the research team has reviewed the results.'}
              </p>

              {isClosed ? (
                <button
                  className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90 shadow-sm"
                  style={{ backgroundColor: '#4A00F8' }}
                  onClick={() => alert('Demo: PDF download triggered')}
                >
                  <Download size={14} />
                  Download Report (PDF)
                </button>
              ) : (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <Mail size={13} className="flex-shrink-0" />
                  <span>You'll receive an email notification when the report is ready.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expiry + footer */}
        <p className="text-xs text-center text-gray-400 py-6">
          This page expires 30 days after the survey closes. · © 2026 Beroe Inc. · Signal Market Report Platform
        </p>
      </div>
    </div>
  );
}
