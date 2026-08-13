'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlarmClock, BookCheck, CircleCheck, CircleX, Flag, Gauge, Target } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { SkillMatrix } from '@/components/skill-matrix';

interface Question {
  id: number;
  categoryId: number;
  type: string;
  difficulty: string;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  correctAnswerData?: { entries: Array<{ account: string; debit: number; credit: number }> };
  explanation: string;
  points: number;
  timeLimit: number;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  questionsCount: number;
}

interface JournalEntry {
  account: string;
  debit: number;
  credit: number;
}

interface Answer {
  questionId: number;
  userAnswer: string;
  userAnswerData?: { entries: JournalEntry[] };
}

interface ResultDetail {
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
  points: number;
  feedback: string;
}

interface ExamResult {
  total: number;
  correct: number;
  points: number;
  maxPoints: number;
  percentage: number;
  grade: string;
  details: ResultDetail[];
}

const categoryLabels: Record<number, string> = {
  1: 'المحاسبة',
  2: 'محاسبة التكاليف',
  3: 'المراجعة',
  4: 'الضرائب',
  5: 'المحاسبة الإدارية',
  6: 'القيود اليومية',
  7: 'المعايير الدولية',
  8: 'التحليل المالي',
  9: 'محاسبة الشركات',
  10: 'المحاسبة الحكومية',
};

function PracticeContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(categoryParam ? parseInt(categoryParam) : null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('easy');
  const [questionsCount, setQuestionsCount] = useState(20);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([
    { account: '', debit: 0, credit: 0 },
    { account: '', debit: 0, credit: 0 },
  ]);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  const getCurrentAnswer = () => {
    const q = questions[currentIndex];
    if (!q) return '';
    return answers.find((a) => a.questionId === q.id)?.userAnswer ?? '';
  };

  const storeAnswer = () => {
    const q = questions[currentIndex];
    if (!q) return;

    const entry: Answer = { questionId: q.id, userAnswer: getCurrentAnswer() };
    if (q.type === 'journal_entry') {
      entry.userAnswerData = { entries: journalEntries.filter((e) => e.account.trim()) };
      entry.userAnswer = '';
    }

    setAnswers((prev) => {
      const idx = prev.findIndex((x) => x.questionId === q.id);
      if (idx === -1) return [...prev, entry];
      const next = [...prev];
      next[idx] = entry;
      return next;
    });
  };

  const startPractice = async () => {
    setLoading(true);
    const params = new URLSearchParams({ random: 'true', count: String(questionsCount), difficulty: selectedDifficulty });
    if (selectedCategory) params.append('categoryId', String(selectedCategory));

    const res = await fetch(`/api/questions?${params}`);
    const data = await res.json();

    setQuestions(data.questions || []);
    setAnswers([]);
    setCurrentIndex(0);
    setFinished(false);
    setResult(null);
    setJournalEntries([
      { account: '', debit: 0, credit: 0 },
      { account: '', debit: 0, credit: 0 },
    ]);
    setStarted(true);
    setLoading(false);
  };

  const finishPractice = useCallback(async () => {
    setFinished(true);
    setLoading(true);

    const details: ResultDetail[] = [];
    let correct = 0;
    let points = 0;
    let maxPoints = 0;

    for (const q of questions) {
      maxPoints += q.points;
      const a = answers.find((x) => x.questionId === q.id);

      if (!a) {
        details.push({ question: q, userAnswer: 'لم يتم الحل', isCorrect: false, points: 0, feedback: 'تم تخطي السؤال' });
        continue;
      }

      const resp = await fetch('/api/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, userAnswer: a.userAnswer, userAnswerData: a.userAnswerData }),
      });
      const r = await resp.json();

      if (r.isCorrect) correct++;
      points += r.points || 0;

      details.push({
        question: q,
        userAnswer: a.userAnswer || JSON.stringify(a.userAnswerData?.entries ?? []),
        isCorrect: !!r.isCorrect,
        points: r.points || 0,
        feedback: r.feedback || '',
      });
    }

    const percentage = maxPoints ? Math.round((points / maxPoints) * 100) : 0;
    const grade = percentage >= 90 ? 'ممتاز' : percentage >= 80 ? 'جيد جدًا' : percentage >= 70 ? 'جيد' : percentage >= 60 ? 'مقبول' : 'يحتاج تحسين';

    setResult({ total: questions.length, correct, points, maxPoints, percentage, grade, details });
    setLoading(false);
  }, [answers, questions]);

  const goToQuestion = (idx: number) => {
    storeAnswer();
    setCurrentIndex(idx);
    const q = questions[idx];
    if (q?.type === 'journal_entry') {
      const stored = answers.find((a) => a.questionId === q.id)?.userAnswerData?.entries;
      setJournalEntries(stored && stored.length ? stored : [{ account: '', debit: 0, credit: 0 }, { account: '', debit: 0, credit: 0 }]);
    }
  };

  const proficiency = useMemo(() => {
    if (!result) return [];
    const byCategory = new Map<number, { earned: number; max: number }>();

    result.details.forEach((d) => {
      const entry = byCategory.get(d.question.categoryId) ?? { earned: 0, max: 0 };
      entry.earned += d.points;
      entry.max += d.question.points;
      byCategory.set(d.question.categoryId, entry);
    });

    return Array.from(byCategory.entries()).map(([categoryId, val]) => ({
      label: categoryLabels[categoryId] ?? `تخصص ${categoryId}`,
      value: val.max ? Math.round((val.earned / val.max) * 100) : 0,
    }));
  }, [result]);

  if (loading && !started) {
    return <SiteShell><div className="container-ledger py-20 text-center text-[#667085]">جاري التحميل...</div></SiteShell>;
  }

  if (!started) {
    return (
      <SiteShell>
        <div className="container-ledger py-8">
          <section className="statement-panel">
            <div className="statement-header flex items-center justify-between">
              <p className="text-xs font-bold tracking-wide text-[#667085]">إعداد اختبار "اختبر نفسك"</p>
              <Link href="/" className="text-sm font-semibold text-[#0f1f33]">الرئيسية</Link>
            </div>

            <div className="grid gap-6 p-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">التخصص</label>
                <select className="input-field mb-4" value={selectedCategory ?? ''} onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">كل التخصصات</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <label className="mb-2 block text-sm font-semibold">المستوى</label>
                <select className="input-field mb-4" value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
                  <option value="easy">مبتدئ</option>
                  <option value="medium">متقدم</option>
                  <option value="hard">خبير</option>
                </select>

                <label className="mb-2 block text-sm font-semibold">عدد الأسئلة</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 30, 40].map((q) => (
                    <button key={q} className={`rounded-lg border px-2 py-2 text-sm font-bold ${questionsCount === q ? 'border-[#0f1f33] bg-[#f6f8fb]' : 'border-[#d0d5dd] bg-white'}`} onClick={() => setQuestionsCount(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="metric-tile"><p className="metric-label">نوع التقييم</p><p className="metric-value text-lg">بعد الاختبار فقط</p></div>
                <div className="metric-tile"><p className="metric-label">التصحيح</p><p className="metric-value text-lg">ذكي وتفصيلي</p></div>
                <div className="metric-tile"><p className="metric-label">الهدف</p><p className="metric-value text-lg">قياس مستواك الحقيقي</p></div>
              </div>
            </div>

            <div className="border-t border-[#d0d5dd] p-5">
              <button className="btn-primary" onClick={startPractice}>ابدأ الاختبار</button>
            </div>
          </section>
        </div>
      </SiteShell>
    );
  }

  if (finished && result) {
    return (
      <SiteShell>
        <div className="container-ledger py-8">
          <section className="statement-panel mb-6">
            <div className="statement-header">
              <p className="text-xs font-bold tracking-wide text-[#667085]">تقرير التقييم بعد الاختبار</p>
            </div>

            <div className="p-6">
              <div className="mb-6 grid gap-3 md:grid-cols-4">
                <div className="metric-tile"><p className="metric-label">النتيجة</p><p className="metric-value numeric">{result.percentage}%</p></div>
                <div className="metric-tile"><p className="metric-label">التقدير</p><p className="metric-value text-lg">{result.grade}</p></div>
                <div className="metric-tile"><p className="metric-label">الصحيح</p><p className="metric-value numeric">{result.correct}/{result.total}</p></div>
                <div className="metric-tile"><p className="metric-label">النقاط</p><p className="metric-value numeric">{result.points}/{result.maxPoints}</p></div>
              </div>

              <div className="mb-6">
                <SkillMatrix skills={proficiency.length ? proficiency : [{ label: 'المحاسبة العامة', value: result.percentage }]} title="مصفوفة الأداء حسب التخصص" />
              </div>

              <div className="statement-panel">
                <div className="statement-header">
                  <p className="text-xs font-bold tracking-wide text-[#667085]">تصحيح الإجابات</p>
                </div>
                <div className="max-h-[420px] overflow-auto p-2">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>التخصص</th>
                        <th>الحالة</th>
                        <th>النقاط</th>
                        <th>الملاحظة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.details.map((d, idx) => (
                        <tr key={`${d.question.id}-${idx}`}>
                          <td className="numeric">{idx + 1}</td>
                          <td>{categoryLabels[d.question.categoryId] ?? d.question.categoryId}</td>
                          <td>{d.isCorrect ? <span className="inline-flex items-center gap-1 text-[#127a56]"><CircleCheck size={14} /> صحيح</span> : <span className="inline-flex items-center gap-1 text-[#b42318]"><CircleX size={14} /> خطأ</span>}</td>
                          <td className="numeric">{d.points}/{d.question.points}</td>
                          <td className="text-[#475467]">{d.feedback}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" onClick={() => { setStarted(false); setFinished(false); setResult(null); }}>اختبار جديد</button>
            <Link href="/" className="btn-secondary">الرئيسية</Link>
          </div>
        </div>
      </SiteShell>
    );
  }

  const q = currentQuestion;
  const currentAnswer = getCurrentAnswer();

  return (
    <SiteShell>
      <div className="container-ledger py-6">
        <section className="statement-panel mb-4">
          <div className="statement-header flex items-center justify-between">
            <p className="text-xs font-bold tracking-wide text-[#667085]">اختبر نفسك — جلسة مباشرة</p>
            <button className="inline-flex items-center gap-1 text-sm font-semibold text-[#b42318]" onClick={finishPractice}><Flag size={14} /> إنهاء الاختبار</button>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-4">
            <div className="metric-tile"><p className="metric-label inline-flex items-center gap-1"><BookCheck size={14} /> السؤال</p><p className="metric-value numeric">{currentIndex + 1}/{questions.length}</p></div>
            <div className="metric-tile"><p className="metric-label inline-flex items-center gap-1"><Gauge size={14} /> المستوى</p><p className="metric-value text-lg">{selectedDifficulty === 'easy' ? 'مبتدئ' : selectedDifficulty === 'medium' ? 'متقدم' : 'خبير'}</p></div>
            <div className="metric-tile"><p className="metric-label inline-flex items-center gap-1"><Target size={14} /> التقدم</p><p className="metric-value numeric">{progress}%</p></div>
            <div className="metric-tile"><p className="metric-label inline-flex items-center gap-1"><AlarmClock size={14} /> زمن السؤال</p><p className="metric-value numeric">{q?.timeLimit ?? 0}ث</p></div>
          </div>
          <div className="px-4 pb-4"><div className="h-2 overflow-hidden rounded-full bg-[#eaecf0]"><div className="h-full bg-[#0f1f33]" style={{ width: `${progress}%` }} /></div></div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <section className="statement-panel">
            <div className="p-5">
              <h2 className="mb-6 text-xl font-bold leading-9 text-[#0f1f33]">{q?.questionText}</h2>

              {q?.type === 'multiple_choice' && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const selected = currentAnswer === opt;
                    return (
                      <button
                        key={opt}
                        className={`option-tile w-full text-right ${selected ? 'is-selected' : ''}`}
                        onClick={() => {
                          const next = answers.filter((a) => a.questionId !== q.id);
                          next.push({ questionId: q.id, userAnswer: opt });
                          setAnswers(next);
                        }}
                      >
                        <span className="option-letter">{letter}</span>
                        <span className="font-semibold text-[#1d2939]">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {q?.type === 'true_false' && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {['صحيح', 'خطأ'].map((opt, i) => (
                    <button
                      key={opt}
                      className={`option-tile text-right ${currentAnswer === opt ? 'is-selected' : ''}`}
                      onClick={() => {
                        const next = answers.filter((a) => a.questionId !== q.id);
                        next.push({ questionId: q.id, userAnswer: opt });
                        setAnswers(next);
                      }}
                    >
                      <span className="option-letter">{i === 0 ? 'A' : 'B'}</span>
                      <span className="font-semibold text-[#1d2939]">{opt}</span>
                    </button>
                  ))}
                </div>
              )}

              {q?.type === 'calculation' && (
                <input
                  className="input-field numeric"
                  dir="ltr"
                  value={currentAnswer}
                  onChange={(e) => {
                    const next = answers.filter((a) => a.questionId !== q.id);
                    next.push({ questionId: q.id, userAnswer: e.target.value });
                    setAnswers(next);
                  }}
                  placeholder="أدخل الناتج الرقمي"
                />
              )}

              {q?.type === 'fill_blank' && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {[0, 1].map((i) => (
                    <input
                      key={i}
                      className="input-field"
                      value={currentAnswer.split(',')[i] ?? ''}
                      onChange={(e) => {
                        const parts = currentAnswer.split(',');
                        parts[i] = e.target.value;
                        const next = answers.filter((a) => a.questionId !== q.id);
                        next.push({ questionId: q.id, userAnswer: parts.join(',') });
                        setAnswers(next);
                      }}
                      placeholder={`الفراغ ${i + 1}`}
                    />
                  ))}
                </div>
              )}

              {q?.type === 'journal_entry' && (
                <div className="overflow-x-auto">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>الحساب</th>
                        <th>مدين</th>
                        <th>دائن</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journalEntries.map((entry, i) => (
                        <tr key={i}>
                          <td><input className="input-field" value={entry.account} onChange={(e) => {
                            const next = [...journalEntries];
                            next[i].account = e.target.value;
                            setJournalEntries(next);
                          }} /></td>
                          <td><input className="input-field numeric" type="number" value={entry.debit || ''} onChange={(e) => {
                            const next = [...journalEntries];
                            next[i].debit = Number(e.target.value) || 0;
                            setJournalEntries(next);
                          }} /></td>
                          <td><input className="input-field numeric" type="number" value={entry.credit || ''} onChange={(e) => {
                            const next = [...journalEntries];
                            next[i].credit = Number(e.target.value) || 0;
                            setJournalEntries(next);
                          }} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-5 flex gap-2">
                <button className="btn-secondary" onClick={() => goToQuestion(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>السابق</button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    storeAnswer();
                    if (currentIndex < questions.length - 1) goToQuestion(currentIndex + 1);
                  }}
                >
                  حفظ والمتابعة
                </button>
                {currentIndex === questions.length - 1 && <button className="btn-accent" onClick={finishPractice}>إنهاء وتصحيح</button>}
              </div>
            </div>
          </section>

          <aside className="statement-panel h-fit">
            <div className="statement-header">
              <p className="text-xs font-bold tracking-wide text-[#667085]">التنقل بين الأسئلة</p>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((item, i) => {
                  const answered = answers.some((a) => a.questionId === item.id);
                  const active = i === currentIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => goToQuestion(i)}
                      className={`rounded-md border py-2 text-xs font-bold numeric ${
                        active
                          ? 'border-[#0f1f33] bg-[#0f1f33] text-white'
                          : answered
                          ? 'border-[#98a2b3] bg-[#f8fafc] text-[#0f1f33]'
                          : 'border-[#d0d5dd] bg-white text-[#667085]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="container-ledger py-10">جاري التحميل...</div>}>
      <PracticeContent />
    </Suspense>
  );
}
