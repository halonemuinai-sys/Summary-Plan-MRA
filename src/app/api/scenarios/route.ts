import { NextResponse } from 'next/server';
import { getAllScenarios, saveScenario } from '@/lib/data-service';
import { ScenarioDataset } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const scenarios = await getAllScenarios();
    return NextResponse.json({ success: true, data: scenarios });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to retrieve scenarios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScenarioDataset;
    if (!body.slug || !body.title) {
      return NextResponse.json({ success: false, error: 'Title and Slug are required' }, { status: 400 });
    }

    const saved = await saveScenario(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save scenario' }, { status: 500 });
  }
}
