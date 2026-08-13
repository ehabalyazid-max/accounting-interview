import { NextRequest, NextResponse } from 'next/server';
import { getAllQuestions } from '@/data/questions';

interface JournalEntry {
  account: string;
  debit: number;
  credit: number;
}

// دالة لتصحيح القيود المحاسبية بشكل ذكي
function checkJournalEntry(
  userAnswer: JournalEntry[],
  correctAnswer: JournalEntry[]
): { isCorrect: boolean; score: number; feedback: string } {
  if (!userAnswer || userAnswer.length === 0) {
    return { isCorrect: false, score: 0, feedback: 'لم يتم إدخال أي قيد' };
  }

  // التحقق من توازن القيد
  const totalDebit = userAnswer.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalCredit = userAnswer.reduce((sum, e) => sum + (e.credit || 0), 0);

  if (totalDebit !== totalCredit) {
    return { 
      isCorrect: false, 
      score: 20, 
      feedback: `القيد غير متوازن. المدين: ${totalDebit}، الدائن: ${totalCredit}` 
    };
  }

  // التحقق من الحسابات الصحيحة
  let matchedAccounts = 0;
  let correctAmounts = 0;

  correctAnswer.forEach(correct => {
    const userEntry = userAnswer.find(u => 
      normalizeAccountName(u.account) === normalizeAccountName(correct.account)
    );

    if (userEntry) {
      matchedAccounts++;
      if (userEntry.debit === correct.debit && userEntry.credit === correct.credit) {
        correctAmounts++;
      }
    }
  });

  const accountScore = (matchedAccounts / correctAnswer.length) * 40;
  const amountScore = (correctAmounts / correctAnswer.length) * 40;
  const balanceScore = totalDebit === totalCredit ? 20 : 0;
  const totalScore = Math.round(accountScore + amountScore + balanceScore);

  if (totalScore >= 90) {
    return { isCorrect: true, score: 100, feedback: 'إجابة ممتازة! القيد صحيح تماماً' };
  } else if (totalScore >= 70) {
    return { isCorrect: true, score: totalScore, feedback: 'إجابة جيدة جداً مع بعض الملاحظات البسيطة' };
  } else if (totalScore >= 50) {
    return { isCorrect: false, score: totalScore, feedback: 'إجابة متوسطة، راجع الحسابات والمبالغ' };
  } else {
    return { isCorrect: false, score: totalScore, feedback: 'الإجابة تحتاج مراجعة. تأكد من الحسابات والأرقام' };
  }
}

// تطبيع اسم الحساب للمقارنة
function normalizeAccountName(name: string): string {
  if (!name) return '';
  return name
    .replace(/حـ\//g, '')
    .replace(/حساب/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// التحقق من إجابة حسابية مع مرونة
function checkCalculation(
  userAnswer: string,
  correctAnswer: string
): { isCorrect: boolean; score: number; feedback: string } {
  const userNum = parseFloat(userAnswer.replace(/[,،]/g, '').trim());
  const correctNum = parseFloat(correctAnswer.replace(/[,،]/g, '').trim());

  if (isNaN(userNum)) {
    return { isCorrect: false, score: 0, feedback: 'الرجاء إدخال رقم صحيح' };
  }

  if (userNum === correctNum) {
    return { isCorrect: true, score: 100, feedback: 'إجابة صحيحة!' };
  }

  // السماح بهامش خطأ بسيط (1%)
  const tolerance = correctNum * 0.01;
  if (Math.abs(userNum - correctNum) <= tolerance) {
    return { isCorrect: true, score: 95, feedback: 'إجابة صحيحة تقريباً (فرق التقريب)' };
  }

  // تقييم جزئي
  const percentError = Math.abs((userNum - correctNum) / correctNum) * 100;
  if (percentError <= 10) {
    return { isCorrect: false, score: 70, feedback: 'قريب جداً من الإجابة الصحيحة' };
  } else if (percentError <= 25) {
    return { isCorrect: false, score: 40, feedback: 'الاتجاه صحيح لكن النتيجة بعيدة' };
  }

  return { isCorrect: false, score: 0, feedback: `الإجابة الصحيحة هي: ${correctNum}` };
}

// التحقق من ملء الفراغ
function checkFillBlank(
  userAnswer: string,
  correctAnswer: string
): { isCorrect: boolean; score: number; feedback: string } {
  const userParts = userAnswer.split(',').map(s => s.trim().toLowerCase());
  const correctParts = correctAnswer.split(',').map(s => s.trim().toLowerCase());

  let matchCount = 0;
  correctParts.forEach((correct, index) => {
    if (userParts[index] && userParts[index].includes(correct)) {
      matchCount++;
    }
  });

  const score = Math.round((matchCount / correctParts.length) * 100);
  
  if (score === 100) {
    return { isCorrect: true, score: 100, feedback: 'إجابة صحيحة!' };
  } else if (score >= 50) {
    return { isCorrect: false, score, feedback: 'إجابة جزئية صحيحة' };
  }
  
  return { isCorrect: false, score: 0, feedback: `الإجابة الصحيحة: ${correctAnswer.replace(',', ' و ')}` };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, userAnswer, userAnswerData } = body;

    const allQuestions = getAllQuestions();
    const question = allQuestions.find(q => q.id === questionId);

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    let result: { isCorrect: boolean; score: number; feedback: string };

    switch (question.type) {
      case 'journal_entry':
        result = checkJournalEntry(
          userAnswerData?.entries || [],
          question.correctAnswerData?.entries || []
        );
        break;

      case 'calculation':
        result = checkCalculation(userAnswer || '', question.correctAnswer);
        break;

      case 'fill_blank':
        result = checkFillBlank(userAnswer || '', question.correctAnswer);
        break;

      case 'multiple_choice':
      case 'true_false':
      default:
        const isCorrect = userAnswer === question.correctAnswer;
        result = {
          isCorrect,
          score: isCorrect ? 100 : 0,
          feedback: isCorrect ? 'إجابة صحيحة!' : 'إجابة خاطئة',
        };
        break;
    }

    return NextResponse.json({
      ...result,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      points: Math.round((result.score / 100) * question.points),
      maxPoints: question.points,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check answer' }, { status: 500 });
  }
}
