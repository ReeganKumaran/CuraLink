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
  const specialtyText = (expert.specialties || []).join(' ');
  const researchText = expert.researchInterests || '';
  const combinedText = [expert.name, expert.institution, specialtyText, researchText]
    .filter(Boolean)
    .join(' ');
  score += textMatchScore(combinedText, keywords) * 60;

  if (context?.condition) {
    const conditionToken = context.condition.toLowerCase();
    const specialtyHit = (specialtyText || '').toLowerCase().includes(conditionToken);
    const researchHit = (researchText || '').toLowerCase().includes(conditionToken);
    if (specialtyHit || researchHit) {
      score += 25;
    }
  }

  if (context?.location && expert.location) {
    const locationToken = context.location.toLowerCase();
    if (expert.location.toLowerCase().includes(locationToken)) {
      score += 10;
    }
  }

  if (expert.availableForMeetings) {
    score += 3;
  }

  return clampScore(score);
};

const computeTrialScore = (trial, keywords, context) => {
  let score = 0;
  const trialText = [
    trial.title,
    trial.condition,
    Array.isArray(trial.tags) ? trial.tags.join(' ') : '',
    trial.summary,
    trial.sponsor,
  ]
    .filter(Boolean)
    .join(' ');
  score += textMatchScore(trialText, keywords) * 60;

  if (context?.condition && trial.condition) {
    if (trial.condition.toLowerCase().includes(context.condition.toLowerCase())) {
      score += 20;
    }
  }

  if (context?.location) {
    const locationToken = context.location.toLowerCase();
    const locationText = [trial.location, trial.city, trial.country].filter(Boolean).join(' ').toLowerCase();
    if (locationText.includes(locationToken)) {
      score += 10;
    }
  }

  const status = (trial.status || '').toLowerCase();
  if (status.includes('recruit') || status.includes('enroll')) {
    score += 5;
  }

  return clampScore(score);
};

const computeDiscussionScore = (question, keywords, context) => {
  let score = 0;
  const discussionText = [
    question.title,
    question.question,
    Array.isArray(question.tags) ? question.tags.join(' ') : '',
    question.category,
  ]
    .filter(Boolean)
    .join(' ');
  score += textMatchScore(discussionText, keywords) * 70;

  if (context?.condition) {
    const conditionToken = context.condition.toLowerCase();
    if (discussionText.toLowerCase().includes(conditionToken)) {
      score += 15;
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
  return `${condition} ${trimmedQuery}`.trim();
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
        return null;
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
            location: context?.location,
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

        if (process.env.NODE_ENV !== 'production') {
          console.log('[UnifiedSearch] experts', experts.slice(0, 3).map((e) => ({ name: e.name, score: e.matchScore })));
          console.log('[UnifiedSearch] trials', trials.slice(0, 3).map((t) => ({ title: t.title, score: t.matchScore })));
          console.log('[UnifiedSearch] discussions', discussions.slice(0, 3).map((d) => ({ title: d.title, score: d.matchScore })));
        }
        setResults({ experts, trials, discussions });
      } catch (err) {
        console.error('Unified search error:', err);
        setError(err?.response?.data?.message || 'Unable to complete search. Please try again.');
      } finally {
        setLoading(false);
      }
      return mergedQuery;
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
