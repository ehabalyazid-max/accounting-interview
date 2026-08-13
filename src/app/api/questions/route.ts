import { NextRequest, NextResponse } from 'next/server';
import { getAllQuestions, getRandomQuestions, categories } from '@/data/questions';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const difficulty = searchParams.get('difficulty');
  const count = parseInt(searchParams.get('count') || '20');
  const random = searchParams.get('random') === 'true';

  try {
    if (random) {
      const questions = getRandomQuestions(
        count,
        categoryId ? parseInt(categoryId) : undefined,
        difficulty || undefined
      );
      return NextResponse.json({ questions, total: questions.length });
    }

    let questions = getAllQuestions();
    
    if (categoryId) {
      questions = questions.filter(q => q.categoryId === parseInt(categoryId));
    }
    
    if (difficulty) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(count, 50);
    const offset = (page - 1) * limit;
    const paginatedQuestions = questions.slice(offset, offset + limit);

    return NextResponse.json({
      questions: paginatedQuestions,
      total: questions.length,
      page,
      totalPages: Math.ceil(questions.length / limit),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, difficulty, count = 20 } = body;

    const questions = getRandomQuestions(
      count,
      categoryId,
      difficulty
    );

    return NextResponse.json({ questions, total: questions.length });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate exam' }, { status: 500 });
  }
}
