# Technical Architecture Proposal: SME Daily Log and Presumptive Tax App

## 1. Purpose and Scope

This proposal describes a small, offline-first mobile app for small and micro business owners in Sierra Leone. The app helps a shopkeeper, trader, artisan, or similar business owner record simple cash-based daily activity, see running totals, and estimate Sierra Leone presumptive tax liability from cumulative turnover.

The product should remain intentionally narrow:

- Record simple sales and expenses.
- Show daily, monthly, quarterly, and year-to-date turnover totals.
- Calculate presumptive tax from cumulative turnover.
- Warn when the business may need other tax treatment, especially GST registration threshold or turnover above the presumptive-tax ceiling.
- Export a simple report or receipt for the owner or tax officer.

This is not a general accounting system. V1 should avoid inventory, invoicing, double-entry bookkeeping, payroll, banking integrations, full GST filing, and complex multi-business workflows.

## 2. Product and Operating Assumptions

Target users mostly have low-end Android phones, intermittent or expensive mobile data, and low digital literacy. The app should therefore be:

- Offline-first: daily use must work without data.
- Small and fast: startup and entry creation should feel instant on low-end Android devices.
- Simple to recover from mistakes: users should be able to edit or delete entries.
- Conservative about tax advice: calculations should be labelled as estimates and tied to a visible tax-rule version.
- Low-maintenance: a small team should be able to ship and support it.

The tax figures in this document use the 2026 Sierra Leone presumptive-tax logic supplied for this project and cross-check with the NRA small and micro taxpayer page. Because Finance Acts can change rates and thresholds, the values should be stored as versioned configuration rather than hard-coded across the UI.

Reference sources used:

- Sierra Leone National Revenue Authority, Small and Micro Taxpayer Regime: https://mail.nra.gov.sl/individuals-and-partnerships/small-and-micro-taxpayer-regime
- Sierra Leone National Revenue Authority, Domestic Tax / GST overview: https://nra.gov.sl/dtd/1

## 3. Recommended Mobile Stack

### Recommendation: React Native with TypeScript

Use React Native with TypeScript for the MVP.

Reasons:

- Good fit for a small app with forms, lists, local persistence, and simple reports.
- A small team can share business logic, validation, tax calculations, and UI code across Android and a possible later iOS build.
- TypeScript helps keep tax calculation code explicit and testable.
- React Native has mature libraries for SQLite, file export, share sheets, localization, and Android packaging.
- The team can update UI and tax-rule logic quickly without maintaining separate native Android and iOS codebases.

Important implementation constraints:

- Prioritize Android first.
- Avoid heavy UI libraries and unnecessary animation packages.
- Test release builds on low-memory Android devices, not only emulators.
- Keep the app usable without sign-in.
- Treat every network feature as optional.

### Alternatives Considered

Flutter is also a reasonable choice. It generally gives consistent UI, strong performance, and good offline support. It may be preferable if the team already has Flutter/Dart experience or wants tighter control over rendering on older devices.

Native Android with Kotlin would produce the smallest and most platform-aligned app, but it increases long-term cost if iOS is ever required and narrows the contributor pool. For this product, native Android is only recommended if the team is certain Android will be the only supported platform for several years.

### Local Storage Recommendation: SQLite

Use SQLite as the local source of truth.

Recommended access layer:

- Use a maintained React Native SQLite binding.
- Keep the schema small and explicit.
- Write a thin repository layer around SQL queries.
- Use database migrations from the first release.

Why SQLite:

- Proven on low-end Android devices.
- Small binary and runtime footprint.
- Works fully offline.
- Easy to back up or export.
- Well suited to append-heavy transaction logs and date-based summary queries.
- Does not require a cloud account or ongoing backend cost.

Avoid Realm or WatermelonDB for V1 unless the team already has strong experience with them. They are capable, but this app does not need complex sync, reactive relational models, or large datasets in the MVP.

### Backend and Sync Recommendation

V1 should be no-backend by default.

Rationale:

- Users may not have reliable or affordable data.
- A login requirement adds friction and support burden.
- Tax calculation and daily logging can run entirely on device.
- Backend operations introduce privacy, hosting, and data protection obligations.

V1 should still support basic data resilience:

- Manual export to CSV and PDF.
- Manual local backup file, shareable through Android share sheet, WhatsApp, email, or file manager.
- Optional reminder to back up monthly or quarterly.

V2 can add optional encrypted cloud backup/sync, but only after the core offline workflow is validated.

If V2 sync is added, use a simple managed backend:

- Supabase, Firebase, or a small custom API are all viable.
- Sync should be opt-in.
- Local SQLite remains the source of truth while offline.
- Use last-updated timestamps and stable UUIDs for conflict detection.
- Avoid real-time sync; periodic background or user-triggered sync is enough.

## 4. Minimal Data Model

Use integer minor units for money. For Sierra Leone, store values as whole new Leones where possible, but the code should name the unit explicitly to avoid Old Leone vs New Leone mistakes.

Recommended convention:

- `currency_code`: `SLE`
- `amount_sle`: integer
- UI label: `Le` or `NLe`, based on local product/legal guidance
- Add a visible setting or onboarding note confirming the app uses New Leone values

### Entity: BusinessProfile

Represents the local business using the app. V1 should assume one active business per app install.

Fields:

- `id`: UUID
- `business_name`: string, optional
- `owner_name`: string, optional
- `business_type`: enum/string, optional, examples: shop, trader, artisan, services, food, other
- `district`: string, optional
- `nra_tin`: string, optional
- `currency_code`: string, default `SLE`
- `tax_year_start_month`: integer, default `1`
- `uses_new_leone`: boolean, default `true`
- `created_at`: timestamp
- `updated_at`: timestamp

Notes:

- Do not block app use if the user does not know their TIN.
- Avoid requiring address, GPS, national ID, photo, or other sensitive details in V1.

### Entity: ActivityEntry

Represents one simple cash-based log entry.

Fields:

- `id`: UUID
- `business_id`: UUID
- `entry_date`: local date, not UTC timestamp
- `type`: enum: `sale` or `expense`
- `amount_sle`: integer, must be greater than 0
- `category`: string/enum, optional
- `note`: string, optional
- `payment_method`: enum, default `cash`, optional values: cash, mobile_money, bank, other
- `receipt_ref`: string, optional
- `created_at`: timestamp
- `updated_at`: timestamp
- `deleted_at`: timestamp, nullable

V1 categories should be deliberately small:

- Sale categories: general sale, service fee, other income
- Expense categories: stock, transport, rent, utilities, wages, other expense

Tax calculation should use sale entries only. Expenses are useful for the owner but do not reduce presumptive tax.

### Entity: TaxRuleSet

Stores the active tax configuration used for calculations.

Fields:

- `id`: UUID or stable string, example `SL_PRESUMPTIVE_2026`
- `country_code`: `SL`
- `tax_year`: integer
- `currency_code`: `SLE`
- `presumptive_min_turnover_sle`: integer, `10000000`
- `presumptive_max_turnover_sle`: integer, `350000000`
- `gst_warning_threshold_sle`: integer, `200000000`
- `gst_rate_percent`: decimal, `15`
- `effective_from`: date
- `effective_to`: date, nullable
- `source_note`: string
- `created_at`: timestamp

### Entity: TaxBracket

Stores bracket rows for a `TaxRuleSet`.

Fields:

- `id`: UUID
- `tax_rule_set_id`: string/UUID
- `lower_bound_sle`: integer
- `upper_bound_sle`: integer, nullable for open-ended
- `base_tax_sle`: integer
- `excess_over_sle`: integer
- `rate_percent`: decimal
- `label`: string
- `sort_order`: integer

2026 presumptive-tax brackets:

| Annual turnover | Base tax | Rate on excess |
| --- | ---: | ---: |
| Under Le 10,000,000 | Le 0 | 0% |
| Le 10,000,000 to Le 20,000,000 | Le 100,000 | 2% over Le 10,000,000 |
| Le 20,000,000 to Le 100,000,000 | Le 300,000 | 4% over Le 20,000,000 |
| Le 100,000,000 to Le 200,000,000 | Le 3,500,000 | 5% over Le 100,000,000 |
| Le 200,000,000 to Le 350,000,000 | Le 8,500,000 | 6% over Le 200,000,000 |

### Derived View: PeriodSummary

This does not need to be a stored table in V1. It can be calculated from `ActivityEntry` and cached only if performance requires it.

Fields returned by query/calculation:

- `business_id`
- `period_type`: `month`, `quarter`, `year_to_date`
- `period_start_date`
- `period_end_date`
- `sales_turnover_sle`
- `expenses_sle`
- `net_cash_sle`
- `cumulative_turnover_sle`
- `estimated_presumptive_tax_sle`
- `estimated_installment_due_sle`
- `gst_warning`: boolean
- `above_presumptive_threshold_warning`: boolean
- `tax_rule_set_id`
- `calculated_at`

For tax, the most important value is cumulative turnover for the tax year through the quarter-end date.

## 5. Tax Calculation Logic

### Interpretation for V1

Presumptive tax is based on gross turnover, not profit. Expense entries must not reduce presumptive tax.

For quarterly payments, calculate estimated annual liability using cumulative turnover to date, then determine what portion is due by the current installment after subtracting previous estimated installments recorded as paid or due. If the app does not track actual payments in V1, show the cumulative estimated liability and a simple quarter estimate, but avoid claiming that a specific balance is legally payable.

V1 should show:

- Cumulative sales turnover for the tax year.
- Estimated presumptive tax on that cumulative turnover.
- Current quarter installment reminder date.
- GST threshold warning if turnover reaches or exceeds Le 200,000,000 using the configured rule.
- Out-of-scope warning if turnover exceeds Le 350,000,000.

### Pseudocode

```text
function calculatePeriodTax(businessId, periodEndDate):
    taxYear = taxYearForDate(periodEndDate, business.tax_year_start_month)
    ruleSet = getActiveTaxRuleSet(country="SL", taxYear=taxYear)

    taxYearStart = firstDayOfTaxYear(periodEndDate, business.tax_year_start_month)

    cumulativeTurnover = sum(ActivityEntry.amount_sle)
        where business_id = businessId
        and type = "sale"
        and deleted_at is null
        and entry_date >= taxYearStart
        and entry_date <= periodEndDate

    periodExpenses = sum(ActivityEntry.amount_sle)
        where business_id = businessId
        and type = "expense"
        and deleted_at is null
        and entry_date is inside requested reporting period

    annualizedOrCumulativeTax = calculatePresumptiveTax(
        turnover = cumulativeTurnover,
        ruleSet = ruleSet
    )

    gstWarning = cumulativeTurnover >= ruleSet.gst_warning_threshold_sle
    abovePresumptiveThreshold = cumulativeTurnover > ruleSet.presumptive_max_turnover_sle

    currentQuarter = quarterForDate(periodEndDate)
    dueDate = installmentDueDate(currentQuarter)

    if paymentTrackingEnabled:
        previousTaxPaidOrDue = sum(TaxPayment.amount_sle)
            where business_id = businessId
            and tax_year = taxYear
            and payment_date <= previousQuarterEnd(periodEndDate)

        estimatedInstallmentDue = max(
            annualizedOrCumulativeTax - previousTaxPaidOrDue,
            0
        )
    else:
        estimatedInstallmentDue = annualizedOrCumulativeTax

    return {
        cumulative_turnover_sle: cumulativeTurnover,
        expenses_sle: periodExpenses,
        estimated_presumptive_tax_sle: annualizedOrCumulativeTax,
        estimated_installment_due_sle: estimatedInstallmentDue,
        gst_warning: gstWarning,
        above_presumptive_threshold_warning: abovePresumptiveThreshold,
        installment_due_date: dueDate,
        tax_rule_set_id: ruleSet.id
    }
```

```text
function calculatePresumptiveTax(turnover, ruleSet):
    if turnover < ruleSet.presumptive_min_turnover_sle:
        return 0

    if turnover > ruleSet.presumptive_max_turnover_sle:
        return null
        // Presumptive tax no longer applies.
        // UI should show: "Your turnover is above the presumptive tax range.
        // Please seek NRA guidance or professional tax advice."

    bracket = find first TaxBracket where:
        turnover >= bracket.lower_bound_sle
        and (
            bracket.upper_bound_sle is null
            or turnover <= bracket.upper_bound_sle
        )

    tax = bracket.base_tax_sle
        + ((turnover - bracket.excess_over_sle) * bracket.rate_percent / 100)

    return roundToNearestLeone(tax)
```

### Due Dates

Quarterly installment reminders:

- 15 March
- 15 June
- 15 September
- 15 December

The app should show reminders before these dates, but V1 should not attempt to file or pay tax.

## 6. App Architecture

### High-Level Modules

Recommended app modules:

- `Profile`: local business setup and tax year settings.
- `Entries`: add, edit, delete, and list sales or expenses.
- `Dashboard`: today, month, quarter, and year-to-date totals.
- `TaxEstimate`: presumptive-tax calculation, warnings, and due dates.
- `Export`: CSV/PDF/share sheet output.
- `Settings`: backup, currency explanation, tax-rule version, and app language.

### Data Flow

The app should follow a simple local-first flow:

1. User creates or edits an activity entry.
2. Entry is validated in the UI and repository layer.
3. Entry is saved to SQLite.
4. Dashboard and tax screens query SQLite summaries.
5. Tax service applies the active `TaxRuleSet`.
6. Export service generates a local file from the same summary queries.

Tax calculation should live in a pure TypeScript module with unit tests. It should not depend on React components, SQLite, or network code.

### UI and Accessibility Principles

For low digital literacy, the app should prefer:

- Two prominent actions on the home screen: "Add Sale" and "Add Expense".
- Large numeric keypad-friendly amount entry.
- Dates defaulting to today.
- Minimal required fields.
- Clear distinction between sales and expenses.
- Plain-language warnings, not legal jargon.
- Local language support if product research confirms demand, for example Krio labels or help text.

Avoid:

- Accounting terms like debit, credit, ledger, receivable, payable.
- Complex charts in V1.
- Required sign-up before first entry.
- Hidden navigation for core actions.

## 7. Export and Backup

V1 should include simple exports:

- CSV export of activity entries for a selected date range.
- PDF or printable summary for month, quarter, and year-to-date totals.
- Share through Android share sheet.

Suggested report fields:

- Business name
- Owner name, if provided
- TIN, if provided
- Reporting period
- Total sales turnover
- Total expenses
- Net cash movement
- Estimated presumptive tax
- GST and out-of-scope warnings
- Tax-rule version used
- Generated date

Backup should be separate from export. A backup should preserve raw entries and settings so the app can restore data after a lost or changed phone.

## 8. Phased Build Plan

### V1 MVP

Goal: reliable offline daily logging and tax estimate.

Build:

- Android-first React Native app.
- Local SQLite database with migrations.
- One local business profile.
- Add, edit, delete sales and expenses.
- Daily, monthly, quarterly, and year-to-date totals.
- Presumptive-tax estimate from cumulative turnover.
- GST threshold warning at configured threshold.
- Warning above Le 350,000,000 turnover.
- CSV export.
- Simple manual backup and restore.
- Unit tests for tax brackets and summary queries.

Defer:

- User accounts.
- Cloud sync.
- Full GST filing.
- Inventory.
- Invoicing.
- Multi-business management.
- Payments to NRA.
- OCR or receipt scanning.

### V1.1 Hardening

Goal: reduce support burden after pilot feedback.

Build:

- Better error recovery and restore testing.
- PDF summary export.
- Reminder notifications before quarterly due dates.
- Basic onboarding explaining New Leone and presumptive-tax scope.
- Usability improvements from field testing.
- Optional Krio/localized labels if validated with users.

### V2

Goal: add resilience and optional connected features without making the app feel complex.

Possible additions:

- Optional encrypted cloud backup.
- Optional sync across a replacement phone.
- Multi-business support for users who operate more than one business.
- Tax-rule update mechanism with user-visible version history.
- Payment tracking for quarterly installments.
- GST readiness checklist after threshold warning.
- Accountant/tax officer export format if a partner workflow emerges.

V2 should still avoid becoming a full accounting platform unless the product strategy changes.

## 9. Key Risks and Unknowns

### Tax Rule Changes

Finance Acts and NRA guidance can change thresholds, rates, due dates, and eligibility. Store tax rules as versioned data and show the version used for each estimate. Plan a lightweight process for annual review before each tax year.

### Old Leone vs New Leone Confusion

Sierra Leone redenominated the Leone, and users may still speak in old-Leone amounts. This is a major product and compliance risk. The app must clearly state whether amounts are entered in New Leone and should include examples during onboarding.

### GST Threshold Ambiguity

The product requirement says to warn at Le 200,000,000 trailing 12-month turnover and use 15% GST as the relevant signal. Some public NRA materials may be outdated or inconsistent, so the threshold should be configurable and legally verified before release.

### Offline Data Loss

No-backend V1 reduces complexity but increases risk if a phone is lost, damaged, wiped, or stolen. Manual backup and restore should be included in the MVP, with plain reminders.

### Low Digital Literacy

The main risk is not calculation complexity; it is daily adoption. Field testing should confirm labels, amount entry, date correction, and error recovery with actual shopkeepers/traders before adding features.

### Device Performance

Low-end Android phones may have limited memory and storage. Keep dependencies minimal, avoid large assets, and test release APK size and startup time on real devices.

### Legal and Advice Boundaries

The app should present calculations as estimates, not formal tax filing or legal advice. Warnings should encourage users to contact NRA or a qualified tax adviser when turnover exceeds the presumptive regime or GST obligations may apply.

## 10. Recommended MVP Architecture Summary

Use React Native with TypeScript, SQLite local storage, no required backend, and a small set of focused modules around profile, entries, summaries, tax estimate, export, and backup. Keep tax brackets in versioned configuration and isolate the calculation engine in tested pure TypeScript. Build Android-first, validate on low-end devices, and treat cloud sync, payment tracking, and GST workflows as V2 features.
