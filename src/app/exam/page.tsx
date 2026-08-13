'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlarmClock,
  BookCheck,
  BrainCircuit,
  CircleCheck,
  CircleX,
  FileChartColumnIncreasing,
  Flag,
  Gauge,
  Shield,
  Target,
} from 'lucide-react';
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

function ExamContent() {
  const searchParams = useSearchParams();
  const presetDifficulty = searchParams.get('difficulty') ?? '';

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(presetDifficulty || 'easy');
  const [questionsCount, setQuestionsCount] = useState(20);
  const [durationMin, setDurationMin] = useState(30);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([
    { account: '', debit: 0, credit: 0 },
    { account: '', debit: 0, credit: 0 },
  ]);

  const [examStarted, setExamStarted] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
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

  const getCurrentAnswer = () => {
    const q = questions[currentIndex];
    if (!q) return '';
    return answers.find((a) => a.questionId === q.id)?.userAnswer ?? '';
  };

  const storeAnswer = () => {
    const q = questions[currentIndex];
    if (!q) return;

    const record: Answer = { questionId: q.id, userAnswer: getCurrentAnswer() };
    if (q.type === 'journal_entry') {
      record.userAnswerData = { entries: journalEntries.filter((e) => e.account.trim()) };
      record.userAnswer = '';
    }

    setAnswers((prev) => {
      const idx = prev.findIndex((a) => a.questionId === q.id);
      if (idx === -1) return [...prev, record];
      const next = [...prev];
      next[idx] = record;
      return next;
    });
  };

  const startExam = async () => {
    setLoading(true);
    const params = new URLSearchParams({ random: 'true', count: String(questionsCount) });
    if (selectedCategory) params.append('categoryId', String(selectedCategory));
    if (selectedDifficulty) params.append('difficulty', selectedDifficulty);

    const res = await fetch(`/api/questions?${params}`);
    const data = await res.json();

    setQuestions(data.questions || []);
    setAnswers([]);
    setCurrentIndex(0);
    setJournalEntries([
      { account: '', debit: 0, credit: 0 },
      { account: '', debit: 0, credit: 0 },
    ]);
    setExamStarted(true);
    setExamFinished(false);
    setResult(null);
    setTimeLeft(durationMin * 60);
    setLoading(false);
  };

  const finishExam = useCallback(async () => {
    setExamFinished(true);
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

  useEffect(() => {
    if (!examStarted || examFinished || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, examFinished, timeLeft, finishExam]);

  const goToQuestion = (idx: number) => {
    storeAnswer();
    setCurrentIndex(idx);
    const q = questions[idx];
    if (q?.type === 'journal_entry') {
      const stored = answers.find((a) => a.questionId === q.id)?.userAnswerData?.entries;
      setJournalEntries(stored && stored.length ? stored : [{ account: '', debit: 0, credit: 0 }, { account: '', debit: 0, credit: 0 }]);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

  const strongAreas = proficiency.filter((p) => p.value >= 80).map((p) => p.label);
  const weakAreas = proficiency.filter((p) => p.value < 65).map((p) => p.label);

  if (loading && !examStarted) {
    return <SiteShell><div className="container-ledger py-20 text-center text-[#667085]">جاري تجهيز الاختبار...</div></SiteShell>;
  }

  if (!examStarted) {
    return (
      <SiteShell>
        <div className="container-ledger py-8">
          <section className="statement-panel">
            <div className="statement-header flex items-center justify-between">
              <p className="text-xs font-bold tracking-wide text-[#667085]">إعداد الاختبار</p>
              <Link href="/" className="text-sm font-semibold text-[#0f1f33]">الرئيسية</Link>
            </div>

            <div className="grid gap-6 p-5 md:grid-cols-2">
              <div>
                <h2 className="mb-4 text-xl font-extrabold text-[#0f1f33]">إعداد اختبار مهني</h2>

                <label className="mb-1 block text-sm font-semibold">التخصص</label>
                <select className="input-field mb-4" value={selectedCategory ?? ''} onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">كل التخصصات</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <label className="mb-1 block text-sm font-semibold">الصعوبة</label>
                <select className="input-field mb-4" value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
                  <option value="easy">مبتدئ</option>
                  <option value="medium">متقدم</option>
                  <option value="hard">خبير</option>
                </select>

                <label className="mb-1 block text-sm font-semibold">عدد الأسئلة</label>
                <div className="mb-4 grid grid-cols-4 gap-2">
                  {[10, 20, 30, 50].map((q) => (
                    <button key={q} onClick={() => setQuestionsCount(q)} className={`rounded-lg border px-2 py-2 text-sm font-bold ${questionsCount === q ? 'border-[#0f1f33] bg-[#f6f8fb]' : 'border-[#d0d5dd] bg-white'}`}>{q}</button>
                  ))}
                </div>

                <label className="mb-1 block text-sm font-semibold">المدة (دقيقة)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((m) => (
                    <button key={m} onClick={() => setDurationMin(m)} className={`rounded-lg border px-2 py-2 text-sm font-bold ${durationMin === m ? 'border-[#0f1f33] bg-[#f6f8fb]' : 'border-[#d0d5dd] bg-white'}`}>{m}</button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-bold text-[#0f1f33]">ملاحظات الاختبار</h3>
                <div className="space-y-3">
                  <div className="metric-tile"><p className="metric-label">نوع الاختبار</p><p className="metric-value text-lg">اختبار زمني احترافي</p></div>
                  <div className="metric-tile"><p className="metric-label">التقييم</p><p className="metric-value text-lg">تصحيح ذكي تلقائي</p></div>
                  <div className="metric-tile"><p className="metric-label">المخرجات</p><p className="metric-value text-lg">تقرير كفاءة مهني</p></div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#d0d5dd] p-5">
              <button className="btn-primary" onClick={startExam}>ابدأ الاختبار</button>
            </div>
          </section>
        </div>
      </SiteShell>
    );
  }

  if (examFinished && result) {
    return (
      <SiteShell>
        <div className="container-ledger py-8">
          <section className="statement-panel mb-6 overflow-hidden">
            <div className="statement-header">
              <p className="text-xs font-bold tracking-wide text-[#667085]">تقرير الكفاءة المحاسبية</p>
            </div>

            <div className="p-6">
              <div className="mb-6 grid gap-3 md:grid-cols-4">
                <div className="metric-tile"><p className="metric-label">الدرجة الكلية</p><p className="metric-value numeric">{result.percentage}%</p></div>
                <div className="metric-tile"><p className="metric-label">التقدير</p><p className="metric-value text-lg">{result.grade}</p></div>
                <div className="metric-tile"><p className="metric-label">الإجابات الصحيحة</p><p className="metric-value numeric">{result.correct}/{result.total}</p></div>
                <div className="metric-tile"><p className="metric-label">النقاط</p><p className="metric-value numeric">{result.points}/{result.maxPoints}</p></div>
              </div>

              <div className="mb-6 grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
                <SkillMatrix skills={proficiency.length ? proficiency : [{ label: 'المحاسبة العامة', value: result.percentage }]} title="مصفوفة الأداء حسب التخصص" />

                <div className="statement-panel">
                  <div className="statement-header">
                    <p className="text-xs font-bold tracking-wide text-[#667085]">ملخص التقرير</p>
                  </div>
                  <div className="space-y-4 p-4 text-sm">
                    <div>
                      <p className="mb-1 font-bold text-[#0f1f33]">نقاط القوة</p>
                      <p className="text-[#475467]">{strongAreas.length ? strongAreas.join(' • ') : 'لا توجد نقاط قوة واضحة بعد. استمر بالتدريب.'}</p>
                    </div>
                    <div>
                      <p className="mb-1 font-bold text-[#0f1f33]">نقاط الضعف</p>
                      <p className="text-[#475467]">{weakAreas.length ? weakAreas.join(' • ') : 'لا توجد نقاط ضعف جوهرية حالياً.'}</p>
                    </div>
                    <div>
                      <p className="mb-1 font-bold text-[#0f1f33]">مسار تعلم مقترح</p>
                      <p className="text-[#475467]">ابدأ بأضعف تخصص، ثم اختبر نفسك بـ 20 سؤال موجه، وبعدها نفّذ التحدي اليومي.</p>
                    </div>
                    <div>
                      <p className="mb-1 font-bold text-[#0f1f33]">التحدي القادم</p>
                      <p className="text-[#475467]">اختبار مختلط 30 سؤال خلال 45 دقيقة.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="statement-panel">
                <div className="statement-header">
                  <p className="text-xs font-bold tracking-wide text-[#667085]">مراجعة تفصيلية للأسئلة</p>
                </div>
                <div className="max-h-[420px] overflow-auto p-2">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>التخصص</th>
                        <th>الحالة</th>
                        <th>النقاط</th>
                        <th>ملاحظة</th>
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
            <button className="btn-primary" onClick={() => { setExamStarted(false); setExamFinished(false); setResult(null); }}>اختبار جديد</button>
            <Link href="/practice" className="btn-accent">تدريب موجه</Link>
            <Link href="/" className="btn-secondary">الرئيسية</Link>
          </div>
        </div>
      </SiteShell>
    );
  }

  const q = questions[currentIndex];
  const currentAnswer = getCurrentAnswer();
  const progress = questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  return (
    <SiteShell>
      <div className="container-ledger py-6">
        <section className="statement-panel mb-4">
          <div className="statement-header flex items-center justify-between">
            <p className="text-xs font-bold tracking-wide text-[#667085]">جلسة اختبار مباشرة</p>
            <button className="inline-flex items-center gap-1 text-sm font-semibold text-[#b42318]" onClick={finishExam}><Flag size={14} /> إنهاء</button>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-5">
            <div className="metric-tile"><p className="metric-label inline-flex items-center gap-1"><AlarmClock size={14} /> المؤقت</p><p className="metric-value numeric">{formatTime(timeLeft)}</p></div>
            <div className="metric-tile"><p className="metric-label inline-flex items-center gap-1"><BookCheck size={14} /> السؤال</p><p className="metric-value numeric">{currentIndex + 1}/{questions.length}</p></div>
            <div className="metric-tile"><p className="metric-label inline-flex items-center gap-1"><Gauge size={14} /> الصعوبة</p><p className="metric-value text-lg">{q?.difficulty ?? '-'}</p></div>
            <div className="metric-tile"><p className="metric-label inline-flex items-center gap-1"><FileChartColumnIncreasing size={14} /> التخصص</p><p className="metric-value text-base">{categoryLabels[q?.categoryId ?? 1]}</p></div>
            <div className="metric-tile"><p className="metric-label inline-flex items-center gap-1"><Target size={14} /> التقدم</p><p className="metric-value numeric">{progress}%</p></div>
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
                {currentIndex === questions.length - 1 && <button className="btn-accent" onClick={finishExam}>تسليم الاختبار</button>}
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
              <div className="mt-4 rounded-xl border border-[#d0d5dd] bg-[#f8fafc] p-3 text-sm text-[#475467]">
                <p className="mb-2 inline-flex items-center gap-1 font-semibold text-[#0f1f33]"><Shield size={14} /> بروتوكول الاختبار</p>
                <p>استخدم هذه اللوحة لمراجعة الأسئلة غير المحلولة قبل التسليم النهائي.</p>
              </div>
              <div className="mt-3 rounded-xl border border-[#d0d5dd] bg-[#f8fafc] p-3 text-sm text-[#475467]">
                <p className="mb-2 inline-flex items-center gap-1 font-semibold text-[#0f1f33]"><BrainCircuit size={14} /> نصيحة تركيز</p>
                <p>في حال ضيق الوقت ركز على أسئلة النقاط الأعلى (القيود والمسائل الحسابية).</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}

export default function ExamPage() {
  return (
    <Suspense fallback={<div className="container-ledger py-10">جاري التحميل...</div>}>
      <ExamContent />
    </Suspense>
  );
}
