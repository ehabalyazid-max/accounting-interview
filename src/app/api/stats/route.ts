import { NextResponse } from 'next/server';
import { getAllQuestions, categories } from '@/data/questions';

export async function GET() {
  try {
    const allQuestions = getAllQuestions();
    
    const stats = {
      totalQuestions: allQuestions.length,
      categories: categories.length,
      byDifficulty: {
        easy: allQuestions.filter(q => q.difficulty === 'easy').length,
        medium: allQuestions.filter(q => q.difficulty === 'medium').length,
        hard: allQuestions.filter(q => q.difficulty === 'hard').length,
      },
      byType: {
        multiple_choice: allQuestions.filter(q => q.type === 'multiple_choice').length,
        true_false: allQuestions.filter(q => q.type === 'true_false').length,
        calculation: allQuestions.filter(q => q.type === 'calculation').length,
        journal_entry: allQuestions.filter(q => q.type === 'journal_entry').length,
        fill_blank: allQuestions.filter(q => q.type === 'fill_blank').length,
      },
      categoriesStats: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        count: allQuestions.filter(q => q.categoryId === cat.id).length,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
