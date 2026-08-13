'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Calculator, ChartLine, FileSpreadsheet, ShieldCheck, Scale, TrendingUp } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';

interface Stats {
  totalQuestions: number;
  categories: number;
  byDifficulty: { easy: number; medium: number; hard: number };
  byType: {
    multiple_choice: number;
    true_false: number;
    calculation: number;
    journal_entry: number;
    fill_blank: number;
  };
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  const quickMetrics = useMemo(
    () => [
      { label: 'إجمالي الأسئلة', value: stats?.totalQuestions ?? 30000 },
      { label: 'التخصصات', value: stats?.categories ?? 10 },
      { label: 'ملء الفراغات', value: stats?.byType.fill_blank ?? 7000 },
      { label: 'جلسات اختبار يومية', value: 2 },
    ],
    [stats]
  );

  return (
    <SiteShell>
      <div className="fin-grid">
        <section className="container-ledger py-10">
          <div className="statement-panel overflow-hidden">
            <div className="statement-header">
              <p className="text-xs font-bold tracking-wide text-[#667085]">منصة تقييم مهني في المحاسبة والمالية</p>
            </div>

            <div className="p-6 md:p-8">
              <h1 className="mb-4 text-3xl font-extrabold leading-tight text-[#0f1f33] md:text-5xl">
                اختبر مستواك الحقيقي في
                <span className="mx-2 text-[#1f7a5a]">المحاسبة</span>
                و
                <span className="mx-2 text-[#0f1f33]">المالية</span>
              </h1>

              <p className="mb-7 max-w-3xl text-base leading-8 text-[#475467] md:text-lg">
                من القيود اليومية إلى التحليل المالي — اختبارات احترافية وتصحيح ذكي بعد إنهاء الاختبار
                مع تقرير تقييم واضح يوضح نقاط القوة ونقاط التحسين.
              </p>

              <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {quickMetrics.map((m) => (
                  <div className="metric-tile" key={m.label}>
                    <p className="metric-label">{m.label}</p>
                    <p className="metric-value numeric">{m.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link className="btn-primary inline-flex items-center gap-2" href="/practice">
                  اختبر نفسك
                  <ArrowUpRight size={16} />
                </Link>
                <Link className="btn-accent inline-flex items-center gap-2" href="/exam?difficulty=medium">
                  التحدي اليومي
                  <TrendingUp size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="container-ledger pb-10">
          <div className="statement-panel">
            <div className="statement-header">
              <p className="text-xs font-bold tracking-wide text-[#667085]">التخصصات الأساسية</p>
            </div>
            <div className="grid gap-0 md:grid-cols-3">
              {[
                { title: 'المحاسبة', desc: 'القيود اليومية، ميزان المراجعة، القوائم المالية.', icon: FileSpreadsheet },
                { title: 'المراجعة والتدقيق', desc: 'إجراءات المراجعة، تقييم المخاطر، جودة الأدلة.', icon: ShieldCheck },
                { title: 'الضرائب', desc: 'ضريبة القيمة المضافة، الضريبة، الزكاة، التسويات.', icon: Scale },
                { title: 'محاسبة التكاليف', desc: 'CVP، نقطة التعادل، الانحرافات، التكاليف المعيارية.', icon: Calculator },
                { title: 'التحليل المالي', desc: 'النسب، الاتجاهات، تفسير الأداء المالي.', icon: ChartLine },
                { title: 'الجاهزية المهنية', desc: 'اختبارات محاكية وتقارير تقييم دقيقة.', icon: TrendingUp },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className={`p-5 ${i % 3 !== 2 ? 'md:border-l' : ''} ${i < 3 ? 'border-b md:border-b' : ''} border-[#d0d5dd]`}>
                    <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d0d5dd] bg-[#f8fafc] text-[#0f1f33]">
                      <Icon size={18} />
                    </div>
                    <h3 className="mb-1 text-lg font-bold text-[#0f1f33]">{item.title}</h3>
                    <p className="text-sm leading-7 text-[#475467]">{item.desc}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="container-ledger pb-12">
          <div className="rounded-2xl border border-[#d0d5dd] bg-white p-5 text-center">
            <p className="mb-2 text-sm tracking-wide text-[#667085]">بإشراف</p>
            <h4 className="text-xl font-extrabold text-[#0f1f33]">أ/ إيهاب محمد جلال</h4>
            <p className="mt-2 text-sm text-[#475467]">Smart Financial Solutions Academy</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#d0d5dd] pt-4 text-sm text-[#667085]">
            <span>© 2026 Smart Financial Solutions Academy - جميع الحقوق محفوظة</span>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
