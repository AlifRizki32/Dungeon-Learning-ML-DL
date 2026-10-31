import test from 'node:test';
import assert from 'node:assert/strict';
import floor1QuizData from '../data/quizzes/floor1.json';
import {
  calculateCritBonusXP,
  evaluateQuizRun,
  getMonsterDialogue,
  getQuestionsForTopic,
  getWeakestTopics,
  shuffleQuizQuestions,
} from './quizEngine';

test('floor1.json has reviewStatus needs-human-review and 5 valid questions per Floor 1 topic', () => {
  assert.equal(floor1QuizData.reviewStatus, 'needs-human-review');
  for (let i = 1; i <= 6; i++) {
    const topicId = `topic-${i}`;
    const questions = getQuestionsForTopic(topicId);
    assert.equal(questions.length, 5, `Expected 5 questions for ${topicId}`);
    for (const q of questions) {
      assert.equal(q.options.length, 4);
      assert.ok(q.correctIndex >= 0 && q.correctIndex <= 3);
      assert.ok(q.question.length > 10);
      assert.ok(q.explanation.length > 10);
      assert.ok(['mudah', 'sedang', 'sulit'].includes(q.difficulty));
    }
    const dialogue = getMonsterDialogue(topicId, 'fallback');
    assert.notEqual(dialogue, 'fallback');
  }
});

test('evaluateQuizRun requires >= 70% to pass (4/5 = 80% passes, 3/5 = 60% fails)', () => {
  assert.deepEqual(evaluateQuizRun(3, 5), { scorePercent: 60, passed: false });
  assert.deepEqual(evaluateQuizRun(4, 5), { scorePercent: 80, passed: true });
  assert.deepEqual(evaluateQuizRun(5, 5), { scorePercent: 100, passed: true });
});

test('calculateCritBonusXP grants +10% per correct answer once per room', () => {
  // Topic 1 base XP = 75. 4 correct answers = +40% = 30 XP
  assert.equal(calculateCritBonusXP(75, 4, false), 30);
  // 5 correct answers on 75 base XP = +50% = 38 XP
  assert.equal(calculateCritBonusXP(75, 5, false), 38);
  // Already claimed bonus returns 0
  assert.equal(calculateCritBonusXP(75, 5, true), 0);
});

test('getWeakestTopics sorts attempted topics by lowest bestScorePercent first', () => {
  const scores = {
    'topic-1': 100,
    'topic-2': 60,
    'topic-3': 80,
    'topic-6': 40,
  };
  const weakest = getWeakestTopics(scores, 3);
  assert.equal(weakest.length, 3);
  assert.equal(weakest[0].topicId, 'topic-6');
  assert.equal(weakest[0].bestScorePercent, 40);
  assert.equal(weakest[1].topicId, 'topic-2');
  assert.equal(weakest[1].bestScorePercent, 60);
  assert.equal(weakest[2].topicId, 'topic-3');
  assert.equal(weakest[2].bestScorePercent, 80);
});

test('shuffleQuizQuestions preserves all questions', () => {
  const qs = getQuestionsForTopic('topic-1');
  const shuffled = shuffleQuizQuestions(qs, () => 0.25);
  assert.equal(shuffled.length, 5);
});
