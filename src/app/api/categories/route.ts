import { NextResponse } from 'next/server';
import { categories, getAllQuestions } from '@/data/questions';

export async function GET() {
  try {
    const allQuestions = getAllQuestions();
    
    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      questionsCount: allQuestions.filter(q => q.categoryId === cat.id).length,
    }));

    return NextResponse.json({ categories: categoriesWithCount });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
