import { NextResponse } from 'next/server';
import { getScenarioBySlug } from '@/lib/data-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const scenario = await getScenarioBySlug(slug);
    return NextResponse.json({ success: true, data: scenario });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Scenario not found' }, { status: 404 });
  }
}
