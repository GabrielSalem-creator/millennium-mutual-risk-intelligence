# Millennium Mutual: first-pass insurance analysis

## What the files show

The supplied files contain 4,684 policy rows across Auto and Home, 3,276 customer IDs, and 862 claim rows. Fifteen claim IDs appear twice as exact duplicate rows; after removing one copy of each, there are 847 distinct claim records. All distinct claims join to a supplied policy. The files span policy starts from 2024-11-01 to 2026-10-31 and loss dates from 2024-11-06 to 2026-10-30.

The annual-premium column sums to 6,497,610.48 units; the files do not state a currency. After exact duplicate cleanup, recorded claim amounts sum to 4,719,433.24 units and paid amounts sum to 3,266,455.75 units. These amounts cover different timing and accounting bases. **Do not subtract them to estimate profit or report a loss ratio.**

## Observations and candidate decisions

1. **Home claims are larger on average than Auto claims.** Mean reported amount is 8,133.58 for Home (283 claims) and 4,368.57 for Auto (564), a 1.86× descriptive ratio. Decision: split severity by peril, coverage, property/vehicle characteristics, geography, and exposure before considering rate or prevention changes.
2. **High-risk policies show more claim records per policy row.** High: 211 / 712 = 0.296; Low: 297 / 2,337 = 0.127. This is a 2.33× screening ratio, not exposure-adjusted frequency. Decision: rebuild with earned exposure and verify whether the risk bands predict future losses before any pricing action.
3. **Water Damage is the largest reported claim-amount category:** 143 claims, 1,205,493.73 units (25.5% of recorded claim amounts). Collision is 1,178,259.80 (25.0%) and Theft 1,105,846.80 (23.4%). Decision: investigate water-prevention options and property/hazard attributes; do not use this aggregate to reprice individual customers.
4. **Fire is low frequency and high severity in this sample:** 13 claims, mean reported amount 30,165. Decision: examine limits, coverage, mitigation, and catastrophe/reinsurance exposure; the sample is too small for a stable segment conclusion.
5. **There are 48 Open / Under Review claims; 4 were reported over 90 days before the extract cutoff of 2026-10-31.** Decision: triage old open files and check case estimates. The claim amount is not a reserve; the file has no reserve development or IBNR.
6. **Team C’s raw report-to-close median is 18 days** (300 closed claims) vs Team A at 12 (370) and Team B at 13 (129). Decision: compare workload and claim complexity before changing assignment. The raw difference does not prove a team-performance gap.
7. **372 rows are marked Not Renewed.** Among only the 1,878 Renewed + 372 Not Renewed rows, the Not Renewed share is 16.5%. Decision: add renewal cohorts, offered premium changes, and customer-stated reasons before claiming a retention rate or offering discounts.
8. **1,405 of 3,276 customers have both Auto and Home policies.** Decision: calculate household contribution and test service/retention bundles only after accounting for combined losses, discounts, and servicing costs.

## Data-quality automation

- Removed 15 exact duplicated claim rows for analysis; no conflicting duplicate claim IDs were found.
- Standardized 16 city labels to five canonical cities (Toronto, Montreal, Calgary, Ottawa, Quebec City).
- Flagged 6 claims reported before the recorded loss date; left them unchanged for review.
- Found 40 missing ages and 2 ages coded as zero; 4 policies have zero annual premium.
- Found 8 missing claim amounts after de-duplication. The 48 Open / Under Review claims have missing paid amounts, consistent with being unresolved.

The app logs these cleanups and does not edit the original CSVs.

## Why low profit cannot yet be explained

A useful underwriting bridge needs earned premium and ultimate losses on a matched time/exposure basis, plus allocated/unallocated loss-adjustment expense, acquisition commissions, operating expenses, reinsurance cost/recoveries, and investment income. This dataset provides annual premium, claimed amounts, paid amounts, and basic status, but not the needed exposure, reserve development, or expense fields.

The [NAIC defines loss ratio as incurred losses divided by earned premiums](https://content.naic.org/glossary-insurance-terms?id=37); a combined ratio adds expenses. The [Canadian Institute of Actuaries P&C claim-liability standard](https://www.cia-ica.ca/app/themes/wicket/custom/dl_file.php?fid=32823&p=37301) includes case estimates, development on reported claims, and IBNR/claim-adjustment expenses. The [OSFI 2026 Minimum Capital Test](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/minimum-capital-test-guideline-2026) emphasizes uncertainty in ultimate claim cash flows and their timing.

## Long-run math

Let aggregate losses be \(S=\sum_{i=1}^{N} X_i\), where \(N\) is claim count and \(X_i\) is claim severity. Under stable comparable exposures and appropriate independence assumptions, \(E[S]=E[N]E[X]\). Underwriting result is earned premium minus ultimate losses, claim expenses, operating/acquisition expenses, and reinsurance cost; investment return and capital/risk margin also affect total return.

The Law of Large Numbers stabilizes averages only when the risk pool is sufficiently comparable and dependence is controlled. Weather catastrophes create correlated losses, so policy count alone does not guarantee stable profit. Chebyshev’s inequality gives \(P(|\bar X-\mu|\ge\epsilon)\le\sigma^2/(n\epsilon^2)\) for independent equal-variance observations. The app implements the required-sample-size calculation but marks it unavailable until valid exposure and a defensible variance estimate exist. Credibility blending such as \(Z=N/(N+K)\) likewise requires exposure and within/between-group variance; the supplied extract cannot support \(K\).

## Additional data to request next

**First priority:** earned premium by policy/coverage/month; policy effective and termination dates; unit of exposure (vehicle-year / insured-property-year); coverage, limit, deductible, rating plan and rate changes; paid + case reserve snapshots by valuation date; claim development triangles; LAE; commissions/acquisition and operating expense; reinsurance premium and recoveries; investment income; currency and field definitions.

**Then add relevant external risk context:** insured postal/geographic coordinates at an appropriately protected level, property and vehicle attributes, and time-matched hazard data. [Environment and Climate Change Canada provides historical weather downloads](https://climate.weather.gc.ca/historical_data/search_historic_data_e.html); [Natural Resources Canada’s flood-hazard mapping program](https://natural-resources.canada.ca/science-data/science-research/natural-hazards/flood-mapping/flood-hazard-identification-mapping-program) is a possible property-risk source. For Auto theft hypotheses, use current and geographically compatible official crime tables (for example, [Statistics Canada’s 2025 release](https://www150.statcan.gc.ca/n1/daily-quotidien/260722/dq260722a-eng.htm?indgeo=7&indid=4751-5)). Match hazard data to insured exposure and verify definitions/licensing; population-level rates are not policy-level loss rates.

**Do not add cultural identity, ethnicity, mortality, or hospital-use data as pricing proxies.** The supplied portfolio is Auto/Home, not life/health. If injury-liability development is relevant, add permitted claim-level injury severity and medical/settlement costs under appropriate privacy controls, not broad demographic profiling.

## Prototype and competition notes

The app’s written detections are data-derived rules with evidence, caveats, and suggested next decisions. Its screens are at `/` (Millennium Mutual) and `/index.html` (VDO-X behavior prototype). The insurance prototype uses a deterministic rank queue: profit-data gap first, then material peril/risk signals, then claim operations, renewal, and household-retention opportunities.

The Hack 2 the Future brief calls for 2+ insights, 2+ visualizations, a working prototype, 2+ detections, and 1+ justified automation (PDF p. 14). It also says AI is limited to programming and AI creative problem-solving may risk disqualification (PDF p. 4); the organizers say “No slides” for judging (p. 14). Confirm how their rule applies before using AI-generated business interpretations in the submission.

The supplied VDO-X PPTX is a useful inspiration for the detect/decide/act story, but its claims of “5–8×” conversion, 65%+ mobile traffic, 40–60% cost savings, and precise popup conversion rates are not supported by the supplied VDO-X event evidence. Keep these out of the insurance analysis unless independently sourced and validated.

## Actuarial and regulatory references

- [FSRA Ontario Automobile Insurance Rating and Underwriting Guidance](https://www.fsrao.ca/industry/auto-insurance/regulatory-framework/guidance-auto-insurance/automobile-insurance-rating-and-underwriting-guidance): actuarial support, fair treatment, no unfair proxies, and model/data review expectations for Ontario auto filings. It does not set rules for every province or Home insurance.
- [CAS Statement of Principles Regarding P&C Insurance Ratemaking](https://www.casact.org/statement-principles-regarding-property-and-casualty-insurance-ratemaking): context on estimating future transferred-risk costs, with stated U.S. reference scope and non-binding status.
- [CAS credibility review](https://www.casact.org/sites/default/files/2021-03/8_Fisher_et_al.pdf): credibility methods and experience/exposure considerations.
