import { calculatePeriodTax } from '@domain/tax/calculate';
import type { ActivityEntry } from '@domain/entries';
import { formatLe, todayIso } from '@domain/format';
import { SL_PRESUMPTIVE_2026 } from '@domain/tax/rules';

interface Props {
  businessId: string;
  entries: ActivityEntry[];
}

/** Presents an ISO due date ('2026-09-15') as plain-language text ('15 Sep 2026') for readability. */
function formatDueDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function TaxEstimateScreen({ businessId, entries }: Props) {
  const result = calculatePeriodTax(entries, businessId, todayIso());

  return (
    <div className="screen">
      <p className="screen-eyebrow">Presumptive tax · {result.taxRuleSetId}</p>
      <h2>What you'd owe NRA</h2>
      <p className="disclaimer">
        An estimate to help you plan — not a filed return. Confirm with NRA or a qualified tax adviser before paying.
      </p>

      <div className="hero-card">
        <span className="stamp" aria-hidden="true">
          Estimate
        </span>
        <span className="card-label">Estimated presumptive tax</span>
        <span className="hero-value">
          {result.estimatedPresumptiveTaxSle === null ? 'Out of range' : formatLe(result.estimatedPresumptiveTaxSle)}
        </span>
      </div>

      <div className="stat-grid two-up">
        <div className="stat-card plain">
          <span className="stat-label">Turnover this tax year</span>
          <span className="stat-net positive">{formatLe(result.cumulativeTurnoverSle)}</span>
        </div>
        <div className="stat-card plain">
          <span className="stat-label">Next installment due</span>
          <span className="stat-net">{formatDueDate(result.installmentDueDate)}</span>
        </div>
      </div>

      {result.abovePresumptiveThresholdWarning && (
        <div className="notice notice-strong">
          <strong>Above the presumptive tax ceiling.</strong> Your turnover this year is over{' '}
          <span className="amount-inline">{formatLe(SL_PRESUMPTIVE_2026.presumptiveMaxTurnoverSle)}</span>.
          Presumptive tax no longer applies — contact NRA or a tax adviser about the standard corporate tax regime.
        </div>
      )}

      {result.gstWarning && !result.abovePresumptiveThresholdWarning && (
        <div className="notice">
          <strong>Approaching GST registration.</strong> Your turnover has reached the{' '}
          <span className="amount-inline">{formatLe(SL_PRESUMPTIVE_2026.gstWarningThresholdSle)}</span> threshold.
          You may need to register for GST — check with NRA.
        </div>
      )}

      <p className="footnote">
        Rates and thresholds change with each Finance Act — this app should be reviewed at the start of every tax
        year.
      </p>
    </div>
  );
}
