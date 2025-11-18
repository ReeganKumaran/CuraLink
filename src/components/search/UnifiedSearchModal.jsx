import React, { useEffect, useState, useMemo, useRef } from 'react';
import { X, Search, Loader, Sparkles } from 'lucide-react';
import { useUnifiedSearch } from '../../hooks/useUnifiedSearch';

const Section = ({ title, count, children }) => (
  <div>
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <span className="text-xs text-gray-500">{count} result{count !== 1 ? 's' : ''}</span>
    </div>
    {count > 0 ? children : (
      <p className="text-sm text-gray-500">No matches yet. Try refining your keywords.</p>
    )}
  </div>
);

const ResultChip = ({ label }) => (
  <span className="inline-flex rounded-full bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1 mr-2">
    {label}
  </span>
);

const UnifiedSearchModal = ({
  isOpen,
  context,
  onClose,
  onViewExpert,
  onViewTrial,
  onViewDiscussion,
}) => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const { results, loading, error, runSearch } = useUnifiedSearch(context);
  const lastAutoQueryRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(context?.condition || '');
      setSubmittedQuery('');
    }
  }, [isOpen, context?.condition]);

  useEffect(() => {
    if (!isOpen) {
      lastAutoQueryRef.current = null;
      return;
    }

    if (context?.condition && lastAutoQueryRef.current !== context.condition) {
      lastAutoQueryRef.current = context.condition;
      (async () => {
        const finalQuery = await runSearch(context.condition);
        if (finalQuery) {
          setSubmittedQuery(finalQuery);
        }
      })();
    }
  }, [isOpen, context?.condition, runSearch]);

  const handleSearch = async (evt) => {
    evt.preventDefault();
    if (!query.trim()) return;
    const finalQuery = await runSearch(query.trim());
    if (finalQuery) {
      setSubmittedQuery(finalQuery);
    }
  };

  const totalResults = useMemo(() => (
    (results.experts?.length || 0) +
    (results.trials?.length || 0) +
    (results.discussions?.length || 0)
  ), [results]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Close search"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Unified Search</p>
            <h2 className="text-3xl font-semibold text-gray-900">Find researchers, trials & discussions</h2>
            <p className="text-sm text-gray-500">
              Matching scores are tailored using your profile context
              {context?.condition ? ` (condition: ${context.condition})` : ''}
              {context?.location ? ` and location: ${context.location}` : ''}.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by condition, therapy, researcher or trial keyword..."
                className="w-full border rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              type="submit"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-2xl"
            >
              <Sparkles className="w-4 h-4" />
              Search
            </button>
          </form>

          {submittedQuery && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Showing results for</span>
              <ResultChip label={submittedQuery} />
              <span>({totalResults} total)</span>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-primary-600 text-sm">
              <Loader className="w-4 h-4 animate-spin" /> Searching across datasets...
            </div>
          )}

          {error && !loading && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-8">
              <Section title="Researchers" count={results.experts?.length || 0}>
                <div className="space-y-3">
                  {results.experts.map((expert) => (
                    <div
                      key={expert.id}
                      className="border rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-semibold text-gray-900">{expert.name}</h4>
                          <ResultChip label={`${expert.matchScore}% match`} />
                        </div>
                        <p className="text-sm text-gray-600">{expert.institution}</p>
                        <p className="text-xs text-gray-500">
                          {(expert.specialties || []).slice(0, 3).join(', ') || 'Specialty not listed'}
                        </p>
                      </div>
                      <button
                        className="btn-secondary text-sm px-4 py-2"
                        onClick={() => onViewExpert && onViewExpert(expert)}
                      >
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Clinical Trials" count={results.trials?.length || 0}>
                <div className="space-y-3">
                  {results.trials.map((trial) => (
                    <div
                      key={trial.id}
                      className="border rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-semibold text-gray-900">{trial.title}</h4>
                          <ResultChip label={`${trial.matchScore}% match`} />
                        </div>
                        <p className="text-sm text-gray-600">
                          {trial.phase || 'Phase N/A'} • {trial.status || 'Status unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {trial.location || trial.city || trial.country || 'Location not specified'}
                        </p>
                      </div>
                      <button
                        className="btn-secondary text-sm px-4 py-2"
                        onClick={() => onViewTrial && onViewTrial(trial)}
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Discussions" count={results.discussions?.length || 0}>
                <div className="space-y-3">
                  {results.discussions.map((question) => (
                    <div
                      key={question.id}
                      className="border rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-semibold text-gray-900">{question.title}</h4>
                          <ResultChip label={`${question.matchScore}% match`} />
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{question.question}</p>
                      </div>
                      <button
                        className="btn-secondary text-sm px-4 py-2"
                        onClick={() => onViewDiscussion && onViewDiscussion(question)}
                      >
                        View Discussion
                      </button>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedSearchModal;



