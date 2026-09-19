import { NextResponse } from 'next/server';
import { getFinancialHighlights, saveFinancialHighlights } from '@/lib/data-service';
import { FinancialHighlightsData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getFinancialHighlights();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve financial highlights' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FinancialHighlightsData;
    const saved = await saveFinancialHighlights(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to save financial highlights' },
      { status: 500 }
    );
  }
}
