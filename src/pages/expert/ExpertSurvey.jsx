import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { SURVEYS } from '../../data/mockData';

const DEMO_SURVEY = SURVEYS[0];
const DEMO_EXPERT = {
  name: 'Dr. James Wright',
  company: 'SteelCorp',
};

function AutoSaveToast({ visible }) {
  return (
    <div
      className={`fixed top-16 right-4 flex items-center gap-2 bg-white border border-green-200 shadow-md rounded-xl px-4 py-2.5 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
    >
      <Check size={14} className="text-green-500" />
      <span className="text-xs font-medium text-gray-700">Progress saved</span>
    </div>
  );
}

export default function ExpertSurvey() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [autoSave, setAutoSave] = useState(false);
  const saveTimerRef = useRef(null);

  const questions = DEMO_SURVEY.questions;
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const question = questions[currentIndex];

  const triggerAutoSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setAutoSave(true);
    saveTimerRef.current = setTimeout(() => setAutoSave(false), 2000);
  };

  const handleAnswer = (value) => {
    setAnswers(prev => ({ ...prev, [question.id]: value }));
    triggerAutoSave();
  };

  const handleMultiAnswer = (value) => {
    const current = answers[question.id] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setAnswers(prev => ({ ...prev, [question.id]: updated }));
    triggerAutoSave();
  };

  const canGoNext = () => {
    if (!question.required) return true;
    const ans = answers[question.id];
    if (!ans) return false;
    if (Array.isArray(ans) && ans.length === 0) return false;
    return true;
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleSubmit = () => {
    navigate(`/survey/${token}/thank-you`);
  };

  const isLast = currentIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AutoSaveToast visible={autoSave} />

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-5 h-12">
          <div className="flex items-center gap-2">
            <img src="/BeroeLogo.svg" alt="Beroe" style={{ height: '20px', width: 'auto' }} />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 hidden sm:block">Confidential — for research purposes only</span>
            <a
              href="/dashboard"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
              onClick={e => { e.preventDefault(); navigate('/dashboard'); }}
            >
              <ArrowLeft size={12} />
              Back to platform
            </a>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: '#4A00F8' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center pt-16 pb-20">
        <div className="w-full max-w-lg px-5 py-8">
          {/* Survey heading */}
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#4A00F8' }}>
              {DEMO_SURVEY.name}
            </p>
            <p className="text-sm text-gray-500">
              Dear {DEMO_EXPERT.name}, thank you for participating in this Beroe expert survey.
              Your insights will inform the final Signal Market Report.
            </p>
          </div>

          {/* Question counter */}
          <p className="text-xs font-medium text-gray-400 mb-4">
            Question {currentIndex + 1} of {questions.length}
          </p>

          {/* Question card */}
          <div className="fade-in" key={question.id}>
            <h2 className="text-lg font-bold text-gray-900 mb-5 leading-snug">
              {question.text}
              {question.required && <span className="text-red-500 ml-1 font-normal">*</span>}
            </h2>

            {/* Single choice */}
            {question.type === 'single_choice' && (
              <div className="space-y-2.5">
                {question.options.map((opt, i) => {
                  const selected = answers[question.id] === opt;
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all min-h-11 ${
                        selected ? 'text-white' : 'border-gray-200 text-gray-700 hover:border-purple-300 bg-white'
                      }`}
                      style={selected ? { backgroundColor: '#4A00F8', borderColor: '#4A00F8' } : {}}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selected ? 'border-white' : 'border-gray-300'}`}
                        >
                          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        {opt}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Multi choice */}
            {question.type === 'multi_choice' && (
              <div className="space-y-2.5">
                <p className="text-xs text-gray-400 mb-3">Select all that apply</p>
                {question.options.map((opt, i) => {
                  const selected = (answers[question.id] || []).includes(opt);
                  return (
                    <button
                      key={i}
                      onClick={() => handleMultiAnswer(opt)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all min-h-11 ${
                        selected ? 'text-white' : 'border-gray-200 text-gray-700 hover:border-purple-300 bg-white'
                      }`}
                      style={selected ? { backgroundColor: '#4A00F8', borderColor: '#4A00F8' } : {}}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${selected ? 'border-white bg-white/20' : 'border-gray-300'}`}
                        >
                          {selected && <Check size={10} className="text-white" />}
                        </div>
                        {opt}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Rating scale */}
            {question.type === 'rating_scale' && (
              <div>
                <div className="flex gap-3 justify-between mb-3">
                  {Array.from({ length: question.scale }, (_, i) => i + 1).map(n => {
                    const selected = answers[question.id] === n;
                    return (
                      <button
                        key={n}
                        onClick={() => handleAnswer(n)}
                        className={`flex-1 h-14 rounded-xl border-2 text-base font-bold transition-all min-w-11 ${
                          selected ? 'text-white' : 'border-gray-200 text-gray-600 bg-white hover:border-purple-400'
                        }`}
                        style={selected ? { backgroundColor: '#4A00F8', borderColor: '#4A00F8' } : {}}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{question.labels[0]}</span>
                  <span>{question.labels[1]}</span>
                </div>
              </div>
            )}

            {/* Open text */}
            {question.type === 'open_text' && (
              <textarea
                value={answers[question.id] || ''}
                onChange={e => handleAnswer(e.target.value)}
                placeholder="Share your thoughts here..."
                rows={5}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 resize-none focus:border-purple-400 transition-colors"
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom nav bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-3 flex gap-3 max-w-lg mx-auto left-1/2 -translate-x-1/2 w-full" style={{ maxWidth: '32rem' }}>
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>
        {!isLast ? (
          <button
            onClick={handleNext}
            disabled={!canGoNext()}
            className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            style={{ backgroundColor: '#4A00F8' }}
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canGoNext()}
            className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            style={{ backgroundColor: '#10B981' }}
          >
            Submit Survey
          </button>
        )}
      </div>
    </div>
  );
}
