import { useState, useCallback } from 'react';
import expertService from '../services/expertService';
import clinicalTrialService from '../services/clinicalTrialService';
import { useForumData } from './useForumData';

const tokenize = (text = '') =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const textMatchScore = (text, keywords) => {
  if (!text || keywords.length === 0) return 0;
  const tokens = tokenize(text);
  if (tokens.length === 0) return 0;
  const matches = keywords.filter((keyword) =>
    tokens.some((token) => token.includes(keyword))
  );
  return matches.length / keywords.length;
};

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

const computeExpertScore = (expert, keywords, context) => {
  let score = 0;
  score += textMatchScore(expert.name, keywords) * 55;
  score += textMatchScore(expert.institution, keywords) * 20;
  score += textMatchScore((expert.specialties || []).join(' '), keywords) * 15;
  score += textMatchScore(expert.researchInterests, keywords) * 15;

  if (context?.condition) {
    const conditionToken = context.condition.toLowerCase();
    if (
      (expert.researchInterests || '').toLowerCase().includes(conditionToken) ||
      (expert.specialties || []).some((spec) => spec.toLowerCase().includes(conditionToken))
    ) {
      score += 15;
    }
  }

  if (context?.location && expert.location) {
    const locationToken = context.location.toLowerCase();
    if (expert.location.toLowerCase().includes(locationToken)) {
      score += 10;
    }
  }

  return clampScore(score);
};

const computeTrialScore = (trial, keywords, context) => {
  let score = 0;
  score += textMatchScore(trial.title, keywords) * 60;
  score += textMatchScore(trial.condition, keywords) * 25;
  score += textMatchScore(trial.summary, keywords) * 20;

  if (context?.condition && trial.condition) {
    if (trial.condition.toLowerCase().includes(context.condition.toLowerCase())) {
      score += 15;
    }
  }

  if (context?.location) {
    const locationToken = context.location.toLowerCase();
    if (
      (trial.location && trial.location.toLowerCase().includes(locationToken)) ||
      (trial.city && trial.city.toLowerCase().includes(locationToken)) ||
      (trial.country && trial.country.toLowerCase().includes(locationToken))
    ) {
      score += 10;
    }
  }

  return clampScore(score);
};

const computeDiscussionScore = (question, keywords, context) => {
  let score = 0;
  score += textMatchScore(question.title, keywords) * 60;
  score += textMatchScore(question.question, keywords) * 40;

  if (context?.condition) {
    const conditionToken = context.condition.toLowerCase();
    if (
      question.title.toLowerCase().includes(conditionToken) ||
      question.question.toLowerCase().includes(conditionToken)
    ) {
      score += 10;
    }
  }

  return clampScore(score);
};

const mergeQueryWithContext = (rawQuery = '', context = {}) => {
  const trimmedQuery = rawQuery.trim();
  const condition = typeof context.condition === 'string' ? context.condition.trim() : '';
  if (!condition) {
    return trimmedQuery;
  }
  if (!trimmedQuery) {
    return condition;
  }
  const lowerQuery = trimmedQuery.toLowerCase();
  const lowerCondition = condition.toLowerCase();
  if (lowerQuery.includes(lowerCondition)) {
    return trimmedQuery;
  }
  return `${trimmedQuery} ${condition}`.trim();
};

export function useUnifiedSearch(context = {}) {
  const { questions } = useForumData();
  const [results, setResults] = useState({ experts: [], trials: [], discussions: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runSearch = useCallback(
    async (query) => {
      const mergedQuery = mergeQueryWithContext(query, context);
      const keywords = tokenize(mergedQuery);
      if (keywords.length === 0) {
        setResults({ experts: [], trials: [], discussions: [] });
        setError('Enter at least one keyword');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [expertResponse, trialResponse] = await Promise.all([
          expertService.fetchExperts({
            search: mergedQuery,
            condition: context?.condition,
            location: context?.location,
            limit: 40,
          }),
          clinicalTrialService.fetchClinicalTrials({
            search: mergedQuery,
            condition: context?.condition,
            limit: 40,
          }),
        ]);

        const experts = (expertResponse.experts || [])
          .map((expert) => ({
            ...expert,
            matchScore: computeExpertScore(expert, keywords, context),
          }))
          .filter((expert) => expert.matchScore >= 8)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 10);

        const trials = ((trialResponse.trials || trialResponse) || [])
          .map((trial) => ({
            ...trial,
            matchScore: computeTrialScore(trial, keywords, context),
          }))
          .filter((trial) => trial.matchScore >= 8)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 10);

        const discussions = questions
          .map((question) => ({
            ...question,
            matchScore: computeDiscussionScore(question, keywords, context),
          }))
          .filter((question) => question.matchScore >= 8)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 10);

        setResults({ experts, trials, discussions });
      } catch (err) {
        console.error('Unified search error:', err);
        setError(err?.response?.data?.message || 'Unable to complete search. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [context, questions]
  );

  return {
    results,
    loading,
    error,
    runSearch,
  };
}

export default useUnifiedSearch;
