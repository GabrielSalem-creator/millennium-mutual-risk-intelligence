# Verified findings (single source of truth)  — reproduce with `node analysis/fit_model.mjs` and the cleaning in analysis/data.mjs

## Method notes
- Cleaning: 15 duplicate claim rows removed; 16 city spellings -> 5; 140 premiums stored as "$1,046.62" text parsed (old engine counted them as 0); 93 policy + 15 claim dates in DD/MM/YYYY parsed; 6 claims reported before loss flagged; 40 ages missing, 3 under 18.
- Exposure: all claims occur within 363 days of policy start => 12-month term assumed. exposure = min(1,(2026-10-31 - start)/365). Earned premium = annual premium x exposure. (Assumption; Cancelled policies treated as full exposure.)
- Incurred proxy: Paid -> paid; Denied -> 0; Open/Under Review -> claim_amount x (paid/amount ratio of same peril). Loss ratio (LR) = incurred / earned premium. NOT audited accounting; expenses not in data.
- Portfolio: 4,684 policies, 3,276 customers, 847 unique claims. Earned premium 5.09M, incurred proxy 3.57M => LR 0.70 (Auto 0.53, Home 1.03). Home = 35% of earned premium but 51% of incurred. Written premium cleaned = 6.70M (README's 6.50M was understated).

## P1  Broker B07 early-theft cluster
- 173 policies (121 Auto, 52 Home), ALL started 2026-01-07..2026-10-26. Other 9 brokers + direct: none anomalous.
- 70 claims, 60 are Theft (86%); expected Theft claims for that exposure at non-B07 rates = 2.6; Poisson P(>=60) < 1e-15.
- Median days policy start -> loss: 37 (others 159). 63% of B07 claims within 45 days (others 19%). 100% paid, 0 denied (portfolio denial 4.8%).
- Mean theft claim 8,760 vs 5,324 for other theft claims. B07 LR 4.29 (earned 112k, incurred 480k). Excess ~ 0.42M.
- Explains 2026 deterioration: cohort LR 2025H1 0.64, 2025H2 0.68, 2026H1 0.90 (0.58 ex-B07), 2026H2 0.98 (0.62 ex-B07). Portfolio LR 0.70 -> 0.62 without B07.
- 104 of 173 B07 policies are in Toronto (so not a Montreal effect).
- Research: Canadian guidance lists a claim soon after a policy is bound as a fraud red flag; red flags are not proof; no source found giving a 30-day threshold. Sources: https://canadianunderwriter.ca/2021/04/07/brokers-pay-attention-to-these-insurance-fraud-red-flags/ ; https://www.goremutual.ca/broker-circle/fraud-prevention-starts-before-the-claim/ ; https://www.insurancebusinessmag.com/ca/news/auto-motor/how-fake-brokers-are-exploiting-canadas-hunt-for-cheaper-car-insurance-567331.aspx ; Équité Association pools data to identify fraud patterns https://insurancenewsnet.com/oarticle/equite-association-launch-marks-milestone-moment-for-crime-prevention-across-insurance-industry
- Verdict wording: "consistent with organised early-claim fraud or adverse selection; needs SIU investigation; not proof".

## P2  Montreal Home water damage (excluding B07 for all city comparisons)
- Home water claims per exposure-year: Montreal 0.205 (77 claims/376 yrs), Toronto 0.068 (28/410), Calgary 0.061 (16/261), Ottawa 0.095 (13/137), Quebec City 0.043 (7/164). Montreal/Toronto rate ratio 3.00 (95% CI 1.95-4.63). All Home claims ratio 1.63 (CI 1.21-2.20).
- Every other peril: Theft 1.18x (CI 0.55-2.50), Wind/Hail 0.55x, Fire 0.55x => the gap is water only. Severity per water claim is similar (Montreal 8,578 vs Toronto 9,083) => frequency problem.
- Calendar-month water claims, Montreal: Jan2 Feb4 Mar12 Apr14 May10 Jun5 Jul3 Aug3 Sep5 Oct10 Nov3 Dec6; Toronto: 3,3,3,3,2,2,2,4,3,2,0,1 (flat). Spring peak (Mar-May = 36/77) + October bump.
- Not one storm: only 3 Montreal days had 2 water claims; so seasonal/structural, not a single event.
- Holds in every slice (Montreal vs Toronto water freq/yr): risk Low 0.177 vs 0.028, Medium 0.239 vs 0.131, High 0.220 vs 0.067; deductible 500/1000/2500: 0.206/0.224/0.154 vs 0.083/0.065/0.050; channel Agent .217 Broker .202 Online .191 vs .067/.075/.062; every start cohort. => not mix, not channel, not deductible.
- Natural experiment: Quebec City shares province law, claims-coding rules, Team C adjusters, cold climate, but water freq 0.043 => rules out "Quebec rules", "Team C coding", "cold/snow in general". Leaves Montreal-specific: building stock/plumbing, combined sewer overload, density/impervious surface (hypotheses, unproven; no property data).
- Money: Montreal Home incurred/yr 1,878 vs premium/yr 1,235 (LR 1.52). Montreal Home LR excluding water claims = 0.37 (profitable!). Excess water cost vs peer-city frequency ~ 0.375M. Toronto Home premium 1,416 > Montreal 1,235 although Montreal loses 1.5x more. Low-risk-band Montreal: premium 1,007, LR 1.44 vs Toronto low-risk premium 1,175, LR 0.32 => risk band does not capture water risk.
- Montreal Auto LR 0.40 (best line) vs Montreal Home 1.52: same city, same customers, same adjusters => peril not "bad city".
- Evidence (cite scope): IBC Quebec ~25,000 flood-related claims/yr avg past 5 yrs (IBC via CBC) https://www.cbc.ca/1.7292005 ; 2008 Gazette citing IBC Quebec: water damage acute in Montreal because aging infrastructure can't cope (dated, infrastructure not buildings); Montreal heavy-rain guidance https://montreal.ca/en/articles/protecting-your-building-heavy-rains-68382 (sewer overload/backup, basement entry, backwater valves, sump pumps); Toronto guidance lists the same mechanisms https://www.toronto.ca/services-payments/water-environment/managing-rain-melted-snow/basement-flooding/ ; Feb 2025 thaw/storm = >$260M insured damage in ON/QC/Atlantic, ice damming and water infiltration top causes https://www.ibc.ca/news-insights/news/february-extreme-weather-events-in-eastern-canada-cause-over-260-million-in-insured-damage ; RSA: most spring home claims = overland water from snowmelt/heavy rain; Desjardins: freeze-thaw cycling; burst pipe avg repair ~ $16k (brokerage) https://www.insuranceinstitute.ca/en/Insights-And-Publications/CanadianUnderwriterArticles/items/2024/01/19/Brokerage-sees-nearly-200-increase-in-cold-weather-claims ; Montreal plexes ~75% of dwelling stock in 1944 (CMHC, historical) and ~36% homes pre-1961 (Point2Homes, indicative only) https://www.point2homes.com/CA/Demographics/QC/Montreal-Demographics.html ; Toronto runs a voluntary backwater-valve/sump subsidy (now up to $6,650/property from May 2026; ~21,500 properties subsidised by 2017) https://www.toronto.ca/services-payments/water-environment/managing-rain-melted-snow/basement-flooding-protection-subsidy-program/ (no evaluation of effect found); sewer backup/overland water usually need endorsements (coverage varies).
- GAPS stated honestly: no like-for-like Montreal vs Toronto housing-age source found; no monthly Quebec claim-peak source; Toronto "program works" not evidenced.

## P3  Home pricing ignores risk (Auto does not)
- Home LR by band (ex B07): Low 0.66, Medium 1.29, High 0.98; freq/yr .128/.243/.289; avg premium 1,059/1,324/1,879 => Medium underpriced; High loaded 42% over Medium for 19% more frequency.
- Auto LR by band (ex B07): Low .39, Medium .46, High .51 (freq .158/.279/.434, premium 1,239/1,585/2,349) => premium rises in step with frequency; every band profitable (LR rises mildly with risk). Auto 18-24 freq .41, premium 2,179 (LR .60).
- Home premium barely moves with city (ex B07): 1,110 (QC) .. 1,401 (Toronto) vs water freq 0.043..0.205.
- Home deductible (ex B07): premium 1,343 (500) / 1,275 (1000) / 1,153 (2500); LR 1.03/.91/.90 => 500 deductible slightly worse, differences small.

## P4  Claims handling
- Teams are geographic: Team A = Toronto+Ottawa (375 claims), Team B = Calgary (134), Team C = Montreal+Quebec City (338).
- Median report->close days: A 12, B 13, C 18. Slower within same peril too: collision 13/16/19, water 14/19/19. Team C holds 38 of 48 open/under-review claims; 4 open > 90 days.
- Denials: overall 4.8%; Team B 9%; Calgary Home 6/39 = 15%; B07 0/70. Confounded with city/peril: not proof of performance.
- Glass: 115 claims, 68 paid $0 (deductible >= 1000 => 89-100% paid zero), total paid 8,468 => handling cost with no payout.

## P5  Bundles & retention
- 1,405 of 3,276 customers hold Auto+Home. Bundle LR 0.66 vs 0.75; freq/yr 0.214 vs 0.277; Auto bundled LR 0.39 vs 0.66; Home .99 vs 1.15. Bundle Auto premium only ~6% lower (1,486 vs 1,581). (Selection, not causation.)
- Research: J.D. Power 2022 US study: ~95% retention bundlers vs ~85% non-bundlers (US, survey-based) https://www.jdpower.com/business/press-releases/2022-us-home-insurance-study ; no loss-ratio study found.
- Completed-term policies with a claim: Not Renewed 23% (Auto) / 25% (Home) vs 14% / 15% without => claims drive non-renewal; non-renewal does not depend on price quartile (16-17% all four) or city.

## Tested, no pattern (credibility)
- Severity trend (log-OLS, ex B07, per year): Auto -4% (t=-0.45), Home +10% (t=1.07), Collision +5%, Water +1%, Theft +1%; Liability +45% (t=1.97, n=44 = watch only). Premiums flat but no significant severity inflation => no premium-lag story.
- Repeat claimants: 75 policies with >=2 claims vs 67.7 expected under Poisson => chance.
- Theft in Montreal not elevated (Home 0.037 vs Toronto 0.032/yr ex B07). Auto Montreal not elevated (lowest LR 0.40).
- Auto: no city effect on price adequacy; young-driver premium matches frequency.

## Long-run formulas
S = sum of N claim costs; E[S]=E[N]E[X]; Var(S)=lambda(sigma^2+mu^2) for compound Poisson; mean of n policies has SD sigma/sqrt(n); Chebyshev n >= sigma^2/(alpha eps^2).
Montreal Home example (Medium risk, model): see quote_desk.html. Industry combined ratio ~92-95% in 2024 (StatCan/IBC context) -- expense load 30% in the app is an ASSUMPTION.

## Limits
Synthetic/unspecified currency; no expenses/reserves/IBNR; city-level only (no postal/property data); 12-month term assumed; incurred proxy.
