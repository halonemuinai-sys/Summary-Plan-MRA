import pool from './db';
import { ScenarioDataset } from './types';
import { INITIAL_DATASET } from './initial-data';

export async function getAllScenarios(): Promise<ScenarioDataset[]> {
  try {
    const res = await pool.query(
      'SELECT id, slug, title, description, years, items, brand_breakdown, is_locked, created_at, updated_at FROM scenarios ORDER BY updated_at DESC'
    );

    if (res.rows.length === 0) {
      // Auto seed if empty
      await saveScenario(INITIAL_DATASET);
      return [INITIAL_DATASET];
    }

    return res.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      years: row.years,
      items: row.items,
      brandBreakdown: row.brand_breakdown || [],
      isLocked: row.is_locked,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error('PostgreSQL Error in getAllScenarios, fallback to default:', err);
    return [INITIAL_DATASET];
  }
}

export async function getScenarioBySlug(slug: string): Promise<ScenarioDataset> {
  try {
    const res = await pool.query(
      'SELECT id, slug, title, description, years, items, brand_breakdown, is_locked, created_at, updated_at FROM scenarios WHERE slug = $1 LIMIT 1',
      [slug]
    );

    if (res.rows.length > 0) {
      const row = res.rows[0];
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        years: row.years,
        items: row.items,
        brandBreakdown: row.brand_breakdown || [],
        isLocked: row.is_locked,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error(`PostgreSQL Error in getScenarioBySlug(${slug}):`, err);
  }

  // Fallback if not found
  return INITIAL_DATASET;
}

export async function saveScenario(dataset: ScenarioDataset): Promise<ScenarioDataset> {
  try {
    const now = new Date();
    await pool.query(
      `INSERT INTO scenarios (id, slug, title, description, years, items, brand_breakdown, is_locked, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         years = EXCLUDED.years,
         items = EXCLUDED.items,
         brand_breakdown = EXCLUDED.brand_breakdown,
         is_locked = EXCLUDED.is_locked,
         updated_at = EXCLUDED.updated_at`,
      [
        dataset.id || dataset.slug,
        dataset.slug,
        dataset.title,
        dataset.description || '',
        JSON.stringify(dataset.years),
        JSON.stringify(dataset.items),
        JSON.stringify(dataset.brandBreakdown || []),
        dataset.isLocked || false,
        now,
      ]
    );
    dataset.updatedAt = now.toISOString();
    return dataset;
  } catch (err) {
    console.error('PostgreSQL Error in saveScenario:', err);
    throw err;
  }
}
