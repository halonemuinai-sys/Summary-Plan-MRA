import { FinancialRowData, ChartDataPoint } from './types';

/**
 * Recalculates formula-derived rows whenever inputs are changed in the Admin Grid
 */
export function recalculateFinancials(
  items: Record<string, FinancialRowData>,
  years: string[]
): Record<string, FinancialRowData> {
  const updated: Record<string, FinancialRowData> = JSON.parse(JSON.stringify(items));

  for (const year of years) {
    // 1. Total Revenue Check (Divisions roll-up if present)
    const revPub = updated['rev_publisher']?.values[year] ?? 0;
    const revRet = updated['rev_retail']?.values[year] ?? 0;
    const revFnb = updated['rev_fnb']?.values[year] ?? 0;
    if (revPub + revRet + revFnb > 0 && updated['total_revenue']) {
      updated['total_revenue'].values[year] = Number((revPub + revRet + revFnb).toFixed(2));
    }

    const totalRev = updated['total_revenue']?.values[year] ?? 0;

    // 2. COGS Roll-up
    const cogsPub = updated['cogs_publisher']?.values[year] ?? 0;
    const cogsRet = updated['cogs_retail']?.values[year] ?? 0;
    const cogsFnb = updated['cogs_fnb']?.values[year] ?? 0;
    if (cogsPub + cogsRet + cogsFnb > 0 && updated['cogs']) {
      updated['cogs'].values[year] = Number((cogsPub + cogsRet + cogsFnb).toFixed(2));
    }
    const totalCogs = updated['cogs']?.values[year] ?? 0;

    // 3. Gross Profit & GP Margin
    const gp = Number((totalRev - totalCogs).toFixed(2));
    if (updated['gross_profit']) {
      updated['gross_profit'].values[year] = gp;
      updated['gross_profit'].isFormula = true;
    }
    if (updated['gp_margin']) {
      updated['gp_margin'].values[year] = totalRev > 0 ? Number(((gp / totalRev) * 100).toFixed(2)) : 0;
      updated['gp_margin'].isFormula = true;
    }

    // 4. OPEX Roll-up
    const personnel = updated['personnel']?.values[year] ?? 0;
    const marketing = updated['marketing']?.values[year] ?? 0;
    const ga = updated['ga_expenses']?.values[year] ?? 0;
    const constant = updated['constant_expenses']?.values[year] ?? 0;
    const opexSum = Number((personnel + marketing + ga + constant).toFixed(2));
    if (opexSum > 0 && updated['total_opex']) {
      updated['total_opex'].values[year] = opexSum;
      updated['total_opex'].isFormula = true;
    }
    const totalOpex = updated['total_opex']?.values[year] ?? 0;

    if (updated['opex_margin']) {
      updated['opex_margin'].values[year] = totalRev > 0 ? Number(((totalOpex / totalRev) * 100).toFixed(2)) : 0;
      updated['opex_margin'].isFormula = true;
    }

    // 5. Operating Profit (EBIT)
    const ebit = Number((gp - totalOpex).toFixed(2));
    if (updated['operating_profit']) {
      updated['operating_profit'].values[year] = ebit;
      updated['operating_profit'].isFormula = true;
    }

    // 6. Net Profit Before Tax (NPBT)
    const otherExp = updated['other_expenses']?.values[year] ?? 0;
    const npbt = Number((ebit - otherExp).toFixed(2));
    if (updated['npbt']) {
      updated['npbt'].values[year] = npbt;
      updated['npbt'].isFormula = true;
    }

    // 7. Net Profit After Tax (NPAT)
    const tax = updated['income_tax']?.values[year] ?? 0;
    const npat = Number((npbt - tax).toFixed(2));
    if (updated['npat']) {
      updated['npat'].values[year] = npat;
      updated['npat'].isFormula = true;
    }

    // 8. EBITDA After Holding Cost
    const depr = updated['depr_amort']?.values[year] ?? 0;
    if (updated['ebitda_after_holding']) {
      // EBITDA approx = Operating Profit + Depr
      const currentVal = updated['ebitda_after_holding'].values[year];
      // Only recalculate if depr exists or value was 0
      if (depr > 0) {
        updated['ebitda_after_holding'].values[year] = Number((ebit + depr).toFixed(2));
      }
    }
  }

  return updated;
}

/**
 * Transforms raw item rows into unified format for Recharts presentation charts
 */
export function buildChartData(
  items: Record<string, FinancialRowData>,
  years: string[]
): ChartDataPoint[] {
  return years.map((year) => {
    const revenue = items['total_revenue']?.values[year] ?? 0;
    const cogs = items['cogs']?.values[year] ?? 0;
    const grossProfit = items['gross_profit']?.values[year] ?? (revenue - cogs);
    const gpMargin = revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(1)) : 0;
    const opex = items['total_opex']?.values[year] ?? 0;
    const ebitda = items['ebitda_after_holding']?.values[year] ?? 0;
    const ebitdaMargin = revenue > 0 ? Number(((ebitda / revenue) * 100).toFixed(1)) : 0;
    const npat = items['npat']?.values[year] ?? 0;
    const npatMargin = revenue > 0 ? Number(((npat / revenue) * 100).toFixed(1)) : 0;

    return {
      year,
      revenue,
      cogs,
      grossProfit,
      gpMargin,
      opex,
      ebitda,
      ebitdaMargin,
      npat,
      npatMargin
    };
  });
}
