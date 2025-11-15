import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'curalink_forum_data_v1';

const defaultData = {
  questions: [
    {
      id: 'q-1',
      category: 'Cancer Research',
      title: 'Latest treatments for glioblastoma?',
      question:
        'I was recently diagnosed and looking for the latest treatment options. Has anyone participated in trials for new therapies?',
      authorRole: 'patient',
      authorName: 'Patient',
      createdAt: new Date().toISOString(),
      replies: [],
    },
    {
      id: 'q-2',
      category: 'Clinical Trials',
      title: 'What to expect in Phase 2 trials?',
      question:
        'Can someone explain what happens during Phase 2 clinical trials and how side effects are managed?',
      authorRole: 'patient',
      authorName: 'Patient',
      createdAt: new Date().toISOString(),
      replies: [],
    },
  ],
  communities: [],
};

const readStorage = () => {
  if (typeof window === 'undefined') {
    return defaultData;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultData;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return defaultData;
    }
    return {
      questions: Array.isArray(parsed.questions) ? parsed.questions : defaultData.questions,
      communities: Array.isArray(parsed.communities) ? parsed.communities : defaultData.communities,
    };
  } catch (error) {
    console.warn('Failed to read forum storage, falling back to defaults.', error);
    return defaultData;
  }
};

const writeStorage = (data) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to persist forum storage.', error);
  }
};

const createId = (prefix) => `${prefix}-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;

const mapQuestion = (raw) => ({
  ...raw,
  replies: Array.isArray(raw.replies) ? raw.replies : [],
});

export function useForumData() {
  const [data, setData] = useState(() => readStorage());

  useEffect(() => {
    writeStorage(data);
  }, [data]);

  const addQuestion = useCallback((payload) => {
    setData((prev) => ({
      ...prev,
      questions: [
        {
          id: createId('question'),
          category: payload.category,
          title: payload.title,
          question: payload.question,
          authorRole: payload.authorRole,
          authorName: payload.authorName,
          createdAt: new Date().toISOString(),
          replies: [],
        },
        ...prev.questions,
      ],
    }));
  }, []);

  const addReply = useCallback((questionId, payload) => {
    if (payload.authorRole !== 'researcher') {
      throw new Error('Only researchers can reply to questions.');
    }

    setData((prev) => ({
      ...prev,
      questions: prev.questions.map((question) => {
        if (question.id !== questionId) return mapQuestion(question);
        return {
          ...question,
          replies: [
            ...mapQuestion(question).replies,
            {
              id: createId('reply'),
              message: payload.message,
              authorName: payload.authorName,
              authorRole: payload.authorRole,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }),
    }));
  }, []);

  const addCommunity = useCallback((payload) => {
    if (payload.creatorRole !== 'researcher') {
      throw new Error('Only researchers can create communities.');
    }

    setData((prev) => ({
      ...prev,
      communities: [
        {
          id: createId('community'),
          name: payload.name,
          description: payload.description,
          creatorName: payload.creatorName,
          createdAt: new Date().toISOString(),
        },
        ...prev.communities,
      ],
    }));
  }, []);

  const questions = useMemo(
    () => data.questions.map(mapQuestion),
    [data.questions]
  );

  return {
    questions,
    communities: data.communities || [],
    addQuestion,
    addReply,
    addCommunity,
  };
}

export default useForumData;
