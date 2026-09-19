import { ScenarioDataset } from './types';
import { INITIAL_DATASET } from './initial-data';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'scenarios');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getAllScenarios(): ScenarioDataset[] {
  ensureDataDir();
  const scenarios: ScenarioDataset[] = [INITIAL_DATASET];

  try {
    const files = fs.readdirSync(DATA_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
        const parsed = JSON.parse(content) as ScenarioDataset;
        if (parsed.slug !== INITIAL_DATASET.slug) {
          scenarios.push(parsed);
        }
      }
    }
  } catch (err) {
    console.error('Error reading scenarios:', err);
  }

  return scenarios;
}

export function getScenarioBySlug(slug: string): ScenarioDataset {
  if (slug === INITIAL_DATASET.slug) {
    return INITIAL_DATASET;
  }

  ensureDataDir();
  const filePath = path.join(DATA_DIR, `${slug}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error(`Error reading scenario ${slug}:`, err);
    }
  }

  // Fallback to initial
  return INITIAL_DATASET;
}

export function saveScenario(dataset: ScenarioDataset): ScenarioDataset {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, `${dataset.slug}.json`);
  dataset.updatedAt = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2), 'utf-8');
  return dataset;
}
