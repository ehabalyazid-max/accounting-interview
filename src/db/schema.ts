import { pgTable, serial, text, integer, boolean, timestamp, varchar, jsonb, decimal } from 'drizzle-orm/pg-core';

// جدول المستخدمين
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  level: varchar('level', { length: 50 }).default('مبتدئ'), // مبتدئ، متوسط، متقدم
  totalScore: integer('total_score').default(0),
  questionsAnswered: integer('questions_answered').default(0),
  correctAnswers: integer('correct_answers').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// جدول الفئات (التصنيفات)
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 50 }),
  questionsCount: integer('questions_count').default(0),
});

// جدول الأسئلة
export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => categories.id),
  type: varchar('type', { length: 50 }).notNull(), // multiple_choice, true_false, journal_entry, calculation, fill_blank
  difficulty: varchar('difficulty', { length: 20 }).notNull(), // easy, medium, hard
  questionText: text('question_text').notNull(),
  questionData: jsonb('question_data'), // بيانات إضافية للسؤال (أرقام، جداول، إلخ)
  options: jsonb('options'), // الخيارات للأسئلة متعددة الخيارات
  correctAnswer: text('correct_answer').notNull(), // الإجابة الصحيحة
  correctAnswerData: jsonb('correct_answer_data'), // بيانات الإجابة للقيود المحاسبية
  explanation: text('explanation'), // شرح الإجابة
  points: integer('points').default(10),
  timeLimit: integer('time_limit').default(60), // بالثواني
  createdAt: timestamp('created_at').defaultNow(),
});

// جدول الاختبارات
export const exams = pgTable('exams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  categoryId: integer('category_id').references(() => categories.id),
  questionsCount: integer('questions_count').default(20),
  timeLimit: integer('time_limit').default(1800), // 30 دقيقة
  passingScore: integer('passing_score').default(60),
  difficulty: varchar('difficulty', { length: 20 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// جدول محاولات الاختبارات
export const examAttempts = pgTable('exam_attempts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  examId: integer('exam_id').references(() => exams.id),
  score: integer('score').default(0),
  totalQuestions: integer('total_questions').default(0),
  correctAnswers: integer('correct_answers').default(0),
  timeSpent: integer('time_spent').default(0), // بالثواني
  status: varchar('status', { length: 20 }).default('in_progress'), // in_progress, completed
  answers: jsonb('answers'), // إجابات المستخدم
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

// جدول إجابات المستخدم (للتتبع التفصيلي)
export const userAnswers = pgTable('user_answers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  questionId: integer('question_id').references(() => questions.id),
  attemptId: integer('attempt_id').references(() => examAttempts.id),
  userAnswer: text('user_answer'),
  userAnswerData: jsonb('user_answer_data'), // للقيود المحاسبية
  isCorrect: boolean('is_correct'),
  scoreEarned: integer('score_earned').default(0),
  timeSpent: integer('time_spent').default(0),
  answeredAt: timestamp('answered_at').defaultNow(),
});

// جدول الإنجازات
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  requirement: integer('requirement').notNull(), // عدد النقاط أو الإجابات المطلوبة
  type: varchar('type', { length: 50 }).notNull(), // score, correct_answers, exams_completed
});

// جدول إنجازات المستخدمين
export const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  achievementId: integer('achievement_id').references(() => achievements.id),
  earnedAt: timestamp('earned_at').defaultNow(),
});
