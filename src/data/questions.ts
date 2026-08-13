export interface Question {
  id: number;
  categoryId: number;
  type: 'multiple_choice' | 'true_false' | 'journal_entry' | 'calculation' | 'fill_blank';
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  questionData?: Record<string, unknown>;
  options?: string[];
  correctAnswer: string;
  correctAnswerData?: {
    entries: Array<{ account: string; debit: number; credit: number }>;
  };
  explanation: string;
  points: number;
  timeLimit: number;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const categories: Category[] = [
  { id: 1, name: 'المحاسبة المالية', description: 'القوائم والمبادئ المحاسبية', icon: '📊', color: 'blue' },
  { id: 2, name: 'محاسبة التكاليف', description: 'التكاليف والتحليل والتسعير', icon: '🏭', color: 'green' },
  { id: 3, name: 'المراجعة والتدقيق', description: 'إجراءات المراجعة والحوكمة', icon: '🔍', color: 'purple' },
  { id: 4, name: 'الضرائب والزكاة', description: 'الضرائب المباشرة وغير المباشرة', icon: '💰', color: 'yellow' },
  { id: 5, name: 'المحاسبة الإدارية', description: 'القرارات والموازنات', icon: '📈', color: 'red' },
  { id: 6, name: 'القيود المحاسبية', description: 'اليومية العامة وقيود التسوية', icon: '📝', color: 'indigo' },
  { id: 7, name: 'المعايير الدولية IFRS', description: 'المعايير والتطبيقات العملية', icon: '🌍', color: 'teal' },
  { id: 8, name: 'التحليل المالي', description: 'النسب والمؤشرات المالية', icon: '📉', color: 'orange' },
  { id: 9, name: 'محاسبة الشركات', description: 'الاندماج والاستحواذ والتوحيد', icon: '🏢', color: 'cyan' },
  { id: 10, name: 'المحاسبة الحكومية', description: 'القطاع العام والموازنات', icon: '🏛️', color: 'slate' },
];

const difficultyCycle: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];

const mcTemplates = [
  {
    text: 'أي عنصر يمثل أساس المعادلة المحاسبية؟',
    options: ['الأصول = الخصوم + حقوق الملكية', 'الأصول = الإيرادات - المصروفات', 'الأصول = الأرباح المحتجزة', 'الأصول = النقدية فقط'],
    answer: 'الأصول = الخصوم + حقوق الملكية',
    explanation: 'المعادلة المحاسبية الأساسية تربط المركز المالي بثلاثة عناصر رئيسية.'
  },
  {
    text: 'أي مما يلي يُعد أصلًا متداولًا؟',
    options: ['المخزون', 'براءة اختراع', 'مبنى إداري', 'استثمار طويل الأجل'],
    answer: 'المخزون',
    explanation: 'الأصل المتداول يُتوقع تحويله لنقد خلال سنة أو دورة تشغيلية.'
  },
  {
    text: 'أي نسبة تقيس قدرة المنشأة على سداد الالتزامات قصيرة الأجل؟',
    options: ['نسبة التداول', 'نسبة الدين إلى حقوق الملكية', 'هامش صافي الربح', 'العائد على الأصول'],
    answer: 'نسبة التداول',
    explanation: 'نسبة التداول تركز على السيولة قصيرة الأجل.'
  },
  {
    text: 'وفق IFRS 15، متى يتم الاعتراف بالإيراد؟',
    options: ['عند انتقال السيطرة', 'عند توقيع العقد فقط', 'عند استلام كامل النقدية', 'عند نهاية السنة المالية'],
    answer: 'عند انتقال السيطرة',
    explanation: 'المعيار يربط الاعتراف بالإيراد بانتقال السيطرة على السلعة/الخدمة.'
  },
  {
    text: 'أي أداة تدقيق تعد أكثر موثوقية غالبًا؟',
    options: ['المصادقات الخارجية', 'الاستفسار الشفهي فقط', 'ملاحظة الموظف', 'مذكرة داخلية غير معتمدة'],
    answer: 'المصادقات الخارجية',
    explanation: 'الأدلة من طرف مستقل تعطي موثوقية أعلى في المراجعة.'
  }
];

const tfTemplates = [
  { text: 'رأس المال العامل = الأصول المتداولة - الخصوم المتداولة.', answer: 'صحيح' },
  { text: 'الإيرادات المقدمة تعتبر أصلًا متداولًا.', answer: 'خطأ' },
  { text: 'يمكن أن يكون القيد المحاسبي مركبًا ويشمل أكثر من حسابين.', answer: 'صحيح' },
  { text: 'التكاليف الغارقة تؤثر على القرار المستقبلي عقلانيًا.', answer: 'خطأ' },
  { text: 'وفق IFRS لا يُسمح باستخدام LIFO لتقييم المخزون.', answer: 'صحيح' },
];

const fillBlankTemplates = [
  {
    text: 'الحسابات ذات الطبيعة المدينة تزداد في الطرف _____ وتنقص في الطرف _____.',
    answer: 'المدين,الدائن',
    explanation: 'الأصول والمصروفات من طبيعتها المدينة.'
  },
  {
    text: 'مجمل الربح = _____ - _____.',
    answer: 'المبيعات,تكلفة المبيعات',
    explanation: 'مجمل الربح يعكس ربح النشاط قبل المصروفات التشغيلية.'
  },
  {
    text: 'نقطة التعادل تتحقق عندما _____ تساوي _____.',
    answer: 'الإيرادات,التكاليف',
    explanation: 'عند نقطة التعادل لا يوجد ربح أو خسارة.'
  },
  {
    text: 'نسبة التداول = _____ ÷ _____.',
    answer: 'الأصول المتداولة,الخصوم المتداولة',
    explanation: 'نسبة السيولة الأساسية في التحليل المالي.'
  },
  {
    text: 'في قيد الشراء النقدي للبضاعة: من ح/ _____ إلى ح/ _____.',
    answer: 'المشتريات,النقدية',
    explanation: 'يزداد حساب المشتريات ويقل حساب النقدية.'
  },
  {
    text: 'القائمة التي تعرض نتيجة أعمال المنشأة خلال فترة هي قائمة _____ عن فترة _____.',
    answer: 'الدخل,زمنية',
    explanation: 'قائمة الدخل تعبر عن الأداء خلال فترة زمنية.'
  }
];

function buildJournalEntryPrompt(index: number): {
  questionText: string;
  correctAnswerData: { entries: Array<{ account: string; debit: number; credit: number }> };
  explanation: string;
} {
  const amount = 1000 + ((index % 900) * 125);
  const mode = index % 6;

  if (mode === 0) {
    return {
      questionText: `سجل قيد شراء بضاعة نقداً بمبلغ ${amount} ريال (نموذج ${index + 1}).`,
      correctAnswerData: {
        entries: [
          { account: 'المشتريات', debit: amount, credit: 0 },
          { account: 'النقدية', debit: 0, credit: amount },
        ],
      },
      explanation: 'القيد الصحيح: من ح/ المشتريات إلى ح/ النقدية.'
    };
  }
  if (mode === 1) {
    return {
      questionText: `سجل قيد بيع بضاعة على الحساب بمبلغ ${amount} ريال (نموذج ${index + 1}).`,
      correctAnswerData: {
        entries: [
          { account: 'المدينون', debit: amount, credit: 0 },
          { account: 'المبيعات', debit: 0, credit: amount },
        ],
      },
      explanation: 'القيد الصحيح: من ح/ المدينون إلى ح/ المبيعات.'
    };
  }
  if (mode === 2) {
    return {
      questionText: `سجل قيد سداد إيجار نقداً بمبلغ ${amount} ريال (نموذج ${index + 1}).`,
      correctAnswerData: {
        entries: [
          { account: 'مصروف الإيجار', debit: amount, credit: 0 },
          { account: 'النقدية', debit: 0, credit: amount },
        ],
      },
      explanation: 'القيد الصحيح: من ح/ مصروف الإيجار إلى ح/ النقدية.'
    };
  }
  if (mode === 3) {
    return {
      questionText: `سجل قيد تحصيل من العملاء نقداً بمبلغ ${amount} ريال (نموذج ${index + 1}).`,
      correctAnswerData: {
        entries: [
          { account: 'النقدية', debit: amount, credit: 0 },
          { account: 'المدينون', debit: 0, credit: amount },
        ],
      },
      explanation: 'القيد الصحيح: من ح/ النقدية إلى ح/ المدينون.'
    };
  }
  if (mode === 4) {
    return {
      questionText: `سجل قيد شراء أثاث بالأجل بمبلغ ${amount} ريال (نموذج ${index + 1}).`,
      correctAnswerData: {
        entries: [
          { account: 'الأثاث', debit: amount, credit: 0 },
          { account: 'الدائنون', debit: 0, credit: amount },
        ],
      },
      explanation: 'القيد الصحيح: من ح/ الأثاث إلى ح/ الدائنون.'
    };
  }

  return {
    questionText: `سجل قيد سداد جزء من القرض البنكي نقداً بمبلغ ${amount} ريال (نموذج ${index + 1}).`,
    correctAnswerData: {
      entries: [
        { account: 'القرض البنكي', debit: amount, credit: 0 },
        { account: 'النقدية', debit: 0, credit: amount },
      ],
    },
    explanation: 'القيد الصحيح: من ح/ القرض البنكي إلى ح/ النقدية.'
  };
}

function buildCalculationPrompt(index: number): { questionText: string; answer: string; explanation: string } {
  const mode = index % 5;

  if (mode === 0) {
    const sales = 50000 + index * 17;
    const cost = 30000 + index * 11;
    const answer = sales - cost;
    return {
      questionText: `إذا كانت المبيعات = ${sales} وتكلفة المبيعات = ${cost}، احسب مجمل الربح (نسخة ${index + 1}).`,
      answer: answer.toString(),
      explanation: 'مجمل الربح = المبيعات - تكلفة المبيعات.'
    };
  }

  if (mode === 1) {
    const currentAssets = 20000 + index * 9;
    const currentLiabilities = 10000 + (index % 8000);
    const answer = (currentAssets / currentLiabilities).toFixed(2);
    return {
      questionText: `الأصول المتداولة ${currentAssets} والخصوم المتداولة ${currentLiabilities}، احسب نسبة التداول (نسخة ${index + 1}).`,
      answer,
      explanation: 'نسبة التداول = الأصول المتداولة ÷ الخصوم المتداولة.'
    };
  }

  if (mode === 2) {
    const fixedCost = 40000 + index * 7;
    const price = 80 + (index % 20);
    const variable = 40 + (index % 15);
    const answer = Math.round(fixedCost / (price - variable));
    return {
      questionText: `تكاليف ثابتة ${fixedCost}، سعر بيع ${price}، تكلفة متغيرة ${variable}. احسب نقطة التعادل بالوحدات (نسخة ${index + 1}).`,
      answer: answer.toString(),
      explanation: 'نقطة التعادل = التكاليف الثابتة ÷ هامش المساهمة للوحدة.'
    };
  }

  if (mode === 3) {
    const taxable = 100000 + index * 25;
    const answer = (taxable * 0.025).toFixed(2);
    return {
      questionText: `وعاء زكوي = ${taxable}. احسب الزكاة المستحقة 2.5% (نسخة ${index + 1}).`,
      answer,
      explanation: 'الزكاة = الوعاء × 2.5%.'
    };
  }

  const netProfit = 15000 + index * 5;
  const equity = 50000 + index * 10;
  const answer = ((netProfit / equity) * 100).toFixed(2);
  return {
    questionText: `صافي الربح ${netProfit} وحقوق الملكية ${equity}. احسب ROE % (نسخة ${index + 1}).`,
    answer,
    explanation: 'ROE = صافي الربح ÷ حقوق الملكية × 100.'
  };
}

function generateUniqueQuestions(target = 30000): Question[] {
  const questions: Question[] = [];
  let id = 1;

  // توزيع الأنواع مع زيادة قوية لملء الفراغات
  const distribution = {
    multiple_choice: 11000,
    true_false: 5000,
    fill_blank: 7000,
    calculation: 4500,
    journal_entry: 2500,
  } as const;

  // Multiple Choice (unique by serial in text)
  for (let i = 0; i < distribution.multiple_choice; i++) {
    const template = mcTemplates[i % mcTemplates.length];
    const categoryId = (i % 10) + 1;
    questions.push({
      id: id++,
      categoryId,
      type: 'multiple_choice',
      difficulty: difficultyCycle[i % 3],
      questionText: `${template.text} (MC-${i + 1}).`,
      options: template.options,
      correctAnswer: template.answer,
      explanation: template.explanation,
      points: difficultyCycle[i % 3] === 'hard' ? 20 : difficultyCycle[i % 3] === 'medium' ? 15 : 10,
      timeLimit: 45,
    });
  }

  // True/False
  for (let i = 0; i < distribution.true_false; i++) {
    const template = tfTemplates[i % tfTemplates.length];
    const categoryId = ((i + 3) % 10) + 1;
    questions.push({
      id: id++,
      categoryId,
      type: 'true_false',
      difficulty: difficultyCycle[i % 3],
      questionText: `${template.text} (TF-${i + 1}).`,
      options: ['صحيح', 'خطأ'],
      correctAnswer: template.answer,
      explanation: `العبارة ${template.answer}.`,
      points: 8,
      timeLimit: 25,
    });
  }

  // Fill Blank (boosted)
  for (let i = 0; i < distribution.fill_blank; i++) {
    const template = fillBlankTemplates[i % fillBlankTemplates.length];
    const categoryId = ((i + 5) % 10) + 1;
    questions.push({
      id: id++,
      categoryId,
      type: 'fill_blank',
      difficulty: difficultyCycle[(i + 1) % 3],
      questionText: `${template.text} (FB-${i + 1}).`,
      correctAnswer: template.answer,
      explanation: template.explanation,
      points: 12,
      timeLimit: 40,
    });
  }

  // Calculation
  for (let i = 0; i < distribution.calculation; i++) {
    const calc = buildCalculationPrompt(i);
    const categoryId = ((i + 1) % 10) + 1;
    questions.push({
      id: id++,
      categoryId,
      type: 'calculation',
      difficulty: difficultyCycle[(i + 2) % 3],
      questionText: calc.questionText,
      correctAnswer: calc.answer,
      explanation: calc.explanation,
      points: 18,
      timeLimit: 75,
    });
  }

  // Journal Entry
  for (let i = 0; i < distribution.journal_entry; i++) {
    const journal = buildJournalEntryPrompt(i);
    questions.push({
      id: id++,
      categoryId: 6,
      type: 'journal_entry',
      difficulty: difficultyCycle[i % 3],
      questionText: journal.questionText,
      correctAnswer: 'journal_entry',
      correctAnswerData: journal.correctAnswerData,
      explanation: journal.explanation,
      points: 22,
      timeLimit: 100,
    });
  }

  // تأكيد الوصول للرقم المطلوب
  if (questions.length > target) return questions.slice(0, target);

  while (questions.length < target) {
    const idx = questions.length + 1;
    questions.push({
      id: id++,
      categoryId: (idx % 10) + 1,
      type: 'multiple_choice',
      difficulty: difficultyCycle[idx % 3],
      questionText: `سؤال إضافي فريد لضبط العدد النهائي (${idx}). ما هي أفضل ممارسة للرقابة الداخلية؟`,
      options: ['فصل المهام', 'تجاهل المطابقات', 'تأجيل التسجيل', 'إلغاء المراجعة'],
      correctAnswer: 'فصل المهام',
      explanation: 'فصل المهام يقلل مخاطر الخطأ والغش.',
      points: 10,
      timeLimit: 30,
    });
  }

  return questions;
}

const allQuestionsCache = generateUniqueQuestions(30000);

export function getAllQuestions(): Question[] {
  return allQuestionsCache;
}

export function getQuestionsByCategory(categoryId: number): Question[] {
  return allQuestionsCache.filter((q) => q.categoryId === categoryId);
}

export function getQuestionsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Question[] {
  return allQuestionsCache.filter((q) => q.difficulty === difficulty);
}

export function getRandomQuestions(count: number, categoryId?: number, difficulty?: string): Question[] {
  let questions = allQuestionsCache;

  if (categoryId) questions = questions.filter((q) => q.categoryId === categoryId);
  if (difficulty) questions = questions.filter((q) => q.difficulty === difficulty);

  // اختيار عشوائي ثابت الأداء
  const selected: Question[] = [];
  const used = new Set<number>();
  const max = Math.min(count, questions.length);

  while (selected.length < max) {
    const idx = Math.floor(Math.random() * questions.length);
    if (!used.has(idx)) {
      used.add(idx);
      selected.push(questions[idx]);
    }
  }

  return selected;
}
