export type TopicQuestion = {
  question: string;
  correct_answer: string;
  question_type: string;
  success: number;
  failures: number;
  alternatives: string;
};

export type TopicQuestionWithId = TopicQuestion & { id: string };
