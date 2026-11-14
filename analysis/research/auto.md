# Canadian Auto Insurance - claim drivers usable as rating/underwriting variables
Research date: 2026-11-14. Cities: Montreal, Toronto, Ottawa, Calgary, Quebec City.
Status tags: [FETCHED] = I opened the page and read the number; [SEARCH] = number appeared only in a web-search summary, not verified on the page; [UNVERIFIED] = secondary/low-reliability or contradictory.
Many regulator pages (fsrao.ca, lautorite.qc.ca, rates.ca, open.alberta.ca) returned 403/520 to the fetcher, so primary regulator text was NOT read in those cases.

## 1. System differences (Quebec SAAQ no-fault vs Ontario/Alberta private)

1.1 Quebec bodily injury is public (SAAQ, no-fault, no right to sue); private insurers cover property damage + civil liability (property damage portion).
- Claim: Quebec average premium paid by motorists in 2024 = $1,279, INCLUDING SAAQ bodily-injury component; SAAQ processed 91,418 claims in 2025, $1.30B compensation. [FETCHED]
- Source: "Road accidents cost Quebec nearly $1.4 billion in compensation in 2025" - Insurance Portal - https://insurance-portal.ca/article/road-accidents-cost-quebec-nearly-14-billion-in-compensation-in-2025/ - 2025 - Quebec.
- Limit: article does not split SAAQ vs private portion; secondary reporting of SAAQ data.

1.2 Quebec private-insurer-only premium.
- Claim: AMF 2025 annual auto-rating report: average premium written for passenger cars rose 5.5% to $1,067. [SEARCH - from search summary of AMF report; PDF returned 403, not read]
- Source: AMF "Rapport annuel Tarification assurance automobile 2025" https://lautorite.qc.ca/fileadmin/lautorite/grand_public/publications/organisation/rapports-annuels/autorite/Rapport-annuel-Tarification-assurance-automobile-2025.pdf - 2025.
- Other (conflicting, UNVERIFIED): $1,044 for 2024 attributed to Statistics Canada (+16% YoY) via Ratehub https://www.ratehub.ca/blog/how-much-is-car-insurance-in-quebec/; GAA 2022 passenger-vehicle average $796.
- Limit: definitions differ (written vs earned, passenger vs all). Use the AMF/GAA figure as the private-only benchmark and confirm in the PDF.

1.3 Ontario (private tort + statutory accident benefits, SABS).
- Claim: FSRA average private-passenger premium ~$2,120 (June 2025, +4.1% vs 2024) and ~$2,164 (Oct 2025), up from $1,927 (June 2024). [SEARCH - secondary: isure.ca, money.ca; fsrao.ca page 403]
- Sources: https://isure.ca/?p=39021 ; https://money.ca/insurance/auto-insurance/ontario-auto-insurance-rate-cuts-2026 ; FSRA page https://www.fsrao.ca/consumers/auto-insurance/understanding-auto-insurance-rates/your-average-premium (not readable by me).
- Also: Oct 2025 FSRA territory split reported by yieldmaple.com: GTA $2,810; other urban $2,076; rural $1,740 [UNVERIFIED - one secondary site].
- Reform: from 1 July 2026 nine of 12 accident benefits become optional (medical, rehabilitation, attendant care remain standard); auto insurer becomes first payor for medical/rehab. [SEARCH] https://www.fsrao.ca/industry/auto-insurance/changes-statutory-accident-benefits-coverage-ontario-july-1-2026 . Direct Compensation Property Damage optional from 1 Jan 2024 (secondary). Limit: no post-reform loss data yet; tell the model to treat 2026H2+ accident-benefit cost as a structural break.

1.4 Alberta (private tort, grid rating, rate cap) and Care-First (effective 1 Jan 2027).
- AIRB 2026 Market and Trends Report: average full-coverage premium 2025 = $1,903 (+8.7% from $1,751 in 2024); industry private-passenger loss ratio 83.6% vs 70% break-even; return on premium -8.8%; bodily-injury claim severity up ~36% since 2021. [FETCHED] https://www.insurancebusinessmag.com/ca/news/auto-motor/airb-freezes-alberta-auto-insurance-rate-hikes-over-underwriting-rules-588723.aspx - 2026 - Alberta. Limit: trade-press summary of AIRB report; provincial not Calgary.
- Legal/litigation costs = 58.2% of premiums (AIRB 2026 report, cited by IBC). [FETCHED, date 3 Sep 2026] https://insurance-portal.ca/article/alberta-auto-insurance-58-of-premiums-go-to-legal-costs/ . Limit: no methodology given. (IBC/GISA earlier statement: ">50% of premiums go to litigation and injury settlement" [FETCHED] https://www.ibc.ca/news-insights/news/care-first-nears-launch-as-alberta-finalizes-key-insurance-rules)
- Care-First: AIRB confirms ~$297/yr (13.7%) average saving based on filed/approved rates; Oliver Wyman March projection $259; young male drivers save ~$3,094 (30%); middle-aged ~$525 (~14%); seniors ~20%. [FETCHED] https://www.insurancebusinessmag.com/ca/news/auto-motor/carefirst-savings-bigger-than-expected-airb-confirms-589266.aspx - Sept 2026 - Alberta. Limit: modelled, not realised; right to sue persists for out-of-pocket costs and Criminal Code/serious TSA violations; MNP (for IBC) says retained right to sue could erode savings by up to $136/vehicle. https://www.insurancebusinessmag.com/ca/news/auto-motor/alberta-carefirst-pricing-can-now-begin--but-the-260-savings-figure-is-not-locked-in-586593.aspx
- Lump-sum for serious injury up to ~$298,520; disputes go to a new Care-First Tribunal. [FETCHED, IBC link above]
- Pre-reform distortions: Good Driver Rate Cap (3.7% in 2024, 7.5% in 2025); AIRB froze rate increases (Bulletin 08-2025) over insurer underwriting restrictions (denying collision/comprehensive after at-fault claim in 6 yrs or serious conviction in 4 yrs; forced $2,000+ deductibles). Grid Rating System repealed 1 Jan 2027. [FETCHED, 588723 link above]. Limit: 2024-2026 Alberta loss/premium data is rate-capped, so observed prices are not risk-based prices; model on loss cost, not premium.
- Model implication: province x coverage-line split is essential. Quebec: price only property damage/liability; Ontario: tort + SABS (+ reform break July 2026); Alberta: tort until 31 Dec 2026, Care-First from 1 Jan 2027 (bodily-injury severity drivers will change; young male drivers see biggest drop).

## 2. Auto theft

2.1 National/province trend (Equite Association, private passenger vehicles).
- 2024: 57,359 thefts, -18.6% vs 2023; Quebec -32.4%, Ontario -17.4%, Western Canada -12.7%; history 53,382 (2021), 70,082 (2022), 70,475 (2023); 59.3% recovered. [FETCHED] https://insurance-canada.ca/2025/02/20/equite-association-auto-theft-trend-report/ - 2025 release - Canada. Limit: counts, not rates per capita; Atlantic figure not in page.
- H1 2025 vs H1 2024: National 28,549 -> 23,094 (-19.1%); Ontario 12,949 -> 9,600 (-25.9%); Quebec 5,000 -> 3,889 (-22.2%); Western 9,600 -> 8,695 (-9.4%); Alberta 5,042 -> 4,411 (-12.5%); Atlantic 1,000 -> 910 (-9.0%). [FETCHED] https://insurance-canada.ca/2025/07/31/equite-association-auto-theft-decline-progress/ . Limit: some 2024 numbers rounded in source; no city split.
- Full-year 2025: Canada 46,999 vs 57,359 (-18%); Quebec 7,742 vs 10,290 (-25%). [SEARCH - French summary, not the Equite report] 
- Luxury ($200K+) vehicle thefts +47.5% (2024). Theft losses >$1B in claims annually. [FETCHED] https://insurance-canada.ca/2025/11/19/equite-association-toyota-rav4-most-stolen/ . Limit: top-10 table was an image; read counts below from search summaries.

2.2 Most-stolen (2024 data, released Nov 2025). Toyota RAV4 #1 nationally (2,080 thefts); Honda CR-V #3 (1,911); Lexus RX #10 (1,124; 1.14% theft rate); 9 of top 10 are SUVs/trucks. Ontario: Honda CR-V 1,309; Dodge Ram 1500 1,159; Highlander 815; Range Rover 708. Quebec: RAV4 921; CR-V 398. [SEARCH - from news summaries of the Equite list; not verified against the table] sources: https://www.insuranceinstitute.ca/en/Insights-And-Publications/CanadianUnderwriterArticles/items/2025/11/18/Canada-has-a-new-top-stolen-car ; https://canadianautodealer.ca/2025/11/toyota-rav4-tops-equites-most-stolen-vehicles-list-for-2024/ . Limit: counts, not theft RATES by model - for rating use per-exposure rate (Equite gives rate for some models).

2.3 City trend and cost.
- Ontario theft claim cost (IBC): $485M in 2025 vs $723M in 2024; +330% vs 2017 (claim count +97%). 2025 city claim cost: Toronto $114.5M (2017: $32.5M), Brampton $43.2M, Mississauga $31.6M, Ottawa $19.8M (2017: $4.3M, +363%). [FETCHED] https://www.autoremarketing.com/?p=107677 - 2025 - Ontario. Limit: costs not per-vehicle; no Montreal/Calgary equivalents.
- Toronto Police: thefts -32.2% in 2025; 2026 YTD +8.8%; incidents 9,664 (2024) -> 7,305 (2025). [SEARCH] https://nowtoronto.com/news/why-toronto-auto-theft-rises-ontario-decline-expert-reaction/ ; https://www.blogto.com/city/2026/05/toronto-ranked-worst-city-auto-theft/ . Limit: police counts; possible rebound.
- Ottawa Police: Jan-Nov 2025 1,320 vs 1,460 (-9.6%, my calculation); CTV: ~10% drop for 2025. [SEARCH/FETCHED partial: CTV page confirms ~10% only] https://www.ctvnews.ca/ottawa/article/the-hot-spots-for-vehicle-thefts-in-ottawa-in-2025/
- Montreal: >11,500 vehicles stolen on the island in 2023; H1 2025 -18% [SEARCH - single outlet, UNVERIFIED]. Port interceptions 2024: 1,909 vehicles at Montreal+Halifax worth ~$87.8M [SEARCH]. Limit: no verified Montreal-city 2024/2025 count.
- Calgary: Alberta H1 2025 -12.5% (above). Calgary city data NOT found.
- Quebec City: NOT found.

2.4 Anti-theft devices.
- IBC (2000 study): approved immobilizers = 42% lower theft-claim frequency. [SEARCH] https://insurance-portal.ca/article/immobilizers-attributed-to-decrease-in-auto-thefts-premiums . Limit: 25 years old, industry body.
- Transport Canada: CMVSS 114 immobilizer mandate (2007) associated with ~50% decline in theft. [SEARCH] https://tc.canada.ca/en/corporate-services/consultations/updating-canada-s-theft-protection-options-new-vehicles/background-vehicle-immobilizers . Limit: modern relay/CAN-bus attacks bypass factory immobilizers; effect today likely lower. Proposed upgraded immobilizer rules ~2028 model year [SEARCH]. Aftermarket tracker effect: no credible quantified source found (UNVERIFIED).

## 3. Young drivers (18-24) and age curve

3.1 Quebec SAAQ claim frequency by age: highest at 16-20, declining to ~64, rising again 66-74, ~4% at 75+. [FETCHED, qualitative] https://insurance-portal.ca/article/road-accidents-cost-quebec-nearly-14-billion-in-compensation-in-2025/ - 2025 . Limit: bodily-injury claim frequency (SAAQ), no relativities in text.
3.2 SAAQ older "fiches": 16-24 = 8% of licence holders but 19% of drivers involved in injury crashes (avg 2017-2021). [SEARCH] https://saaq.gouv.qc.ca/blob/saaq/documents/publications/fiches-police-jeunes-conducteurs-2022.pdf . Implied over-representation ~2.4x (my arithmetic) - injury crashes, not claims.
3.3 Insurance-Canada summary (2019 data): collision claim frequency 4.72% all drivers; 11% men and 9% women aged 16-20; 8% and 7% aged 21-24. [SEARCH] https://www.insurance-canada.ca/?p=68576 . Limit: dataset not named; implies ~1.5-2.3x vs average for 16-24 (my arithmetic).
3.4 Aviva (2010): +41% claim rate young/new drivers; +93% in Alberta. [SEARCH] Old, company-specific.
3.5 Alberta Care-First: young male drivers' saving $3,094 (30%) implies current tort premium for them is ~$10k (my inference) - i.e. grid-capped bodily-injury cost is extreme for this segment. [FETCHED 589266]
3.6 Price proxies (not risk): PolicyMe: under-25 Ontario >= $350/mo vs $200/mo age 45 (~1.75x+); Ratehub 2023: 17-yo G2 Toronto $809-$1,349/mo on a Civic [FETCHED 2023 page] https://www.ratehub.ca/blog/average-car-insurance-cost-ontario-by-age/ . Limit: quote-based, vehicle-specific.
3.7 Gap: No FSRA/AMF/GIO age-curve relativity table was retrieved (regulator pages blocked). Best primary targets: FSRA Private Passenger Automobile Annual Review (https://www.fsrao.ca/industry/auto-insurance/regulatory-framework/guidance-auto-insurance/ontario-private-passenger-automobile-annual-review-based-industry-data-december-31-2024), GISA, AMF report. Mark young-driver relativity range below as the SEARCH-derived range only.

## 4. Collision/glass frequency drivers
4.1 Winter: Aviva Canada (2011): collision claim rate 3.1% in other seasons vs 4.7% in Dec-Feb (+~50%). [SEARCH] https://www.aviva.com/newsroom/news-releases/2011/11/canada-auto-insurance-claims-almost-double-during-winter-months-14535 . Allstate Canada (Nov 2025, Oct 2023-Sep 2025): Jan, Dec, Feb highest collisions [SEARCH] https://www.carriermanagement.com/news/2025/11/10/281332.htm . Limit: old/company data.
4.2 Winter tires: MPI (Manitoba) 6.3% lower collision frequency; ICBC: 13,025 -> 9,802 winter claims across 111,872 vehicles. [SEARCH] https://insurancebusinessmag.com/ca/news/auto-motor/why-the-winter-months-have-the-highest-car-collision-claims-511914.aspx . Limit: other provinces. Note Quebec mandates winter tires Dec 1 - Mar 15 (not verified here).
4.3 Hail/comprehensive: Calgary Aug 2024 hailstorm ~$3.25B insured (IBC), ~70,000 vehicle claims, vehicle damage ~$1B, ~half total losses. [SEARCH] https://www.ibc.ca/news-insights/news/august-hailstorm-in-calgary-results-in-nearly-2-8-billion-in-insured-damage ; https://insurance-portal.ca/article/calgary-hailstorm-insured-losses-are-now-estimated-at-325-billion/ . Calgary comprehensive needs a hail/cat load, separate from glass. Glass-specific frequency: NOT found.
4.4 Density/mileage: No rigorous Canadian density-to-claims or km-driven relativity found (only anecdotal Allstate rear-end commentary). [UNVERIFIED]. Statistics Canada says cost per claim (severity) is the main driver of premium increases rather than frequency [SEARCH] https://www150.statcan.gc.ca/n1/daily-quotidien/250402/dq250402a-eng.htm .

## 5. Average premium by city/province (prices, not risk; vary by method)
| Place | Figure | Year | Source / status |
|---|---|---|---|
| Toronto | $2,348 avg (+5.26%); quote-based, 6 common vehicles, 35-yo clean driver | H1 2026 | MyChoice https://www.mychoice.ca/blog/car-insurance-market-overview-2026/ [FETCHED] |
| Ottawa | $1,680 (+5.63%) same method | H1 2026 | same [FETCHED] |
| Toronto | $3,997 (2025) vs $3,453 (2022); Ottawa +40% 2022-25 steepest | 2025 | Rates.ca https://rates.ca/resources/toronto-auto-insurance-burden-2026-report [SEARCH, page 403] |
| Toronto | $2,483 (ThinkInsure); median $2,456 (MyChoice 2025) | 2025 | [SEARCH] - methods differ |
| Ontario | $2,120-$2,164 FSRA | 2025 | [SEARCH] see 1.3 |
| Ontario | Rates.ca $2,653 (Mar 2026) | 2026 | [SEARCH] |
| Alberta | $1,903 full coverage | 2025 | AIRB via Insurance Business [FETCHED] |
| Calgary | no credible city figure found; one comparison site shows $3,247 male/$3,147 female profile [UNVERIFIED] | - | - |
| Quebec | $1,067 private passenger (AMF); $1,279 incl. SAAQ | 2024-25 | see 1.1-1.2 |
| Montreal | island avg $1,196 (KBD, 4,386 policies); Westmount $1,874, Anjou $954 | 2026 | [SEARCH, broker blog - UNVERIFIED]; MyChoice quote table Apr 2025: Montreal $811, Quebec City $789 (gap very small) [SEARCH] ; Carsurance claims Montreal ~36% above Quebec City [UNVERIFIED]. Kanetix older study: Montreal 23% above provincial avg https://ca1.rates.ca/montreal-car-insurance-highest-in-province [SEARCH, date old] |
Limit: no single consistent source across all five cities; use only for direction (Toronto/GTA >> Ottawa; Montreal > Quebec City by ~0-35%; Quebec ~half of Ontario/Alberta because bodily injury is public).

## 6. Legally restricted rating variables (compliance) - treat as to-be-confirmed by counsel
Ontario:
- Credit history/rating/score, bankruptcy history, credit-card possession, residence history, employment status/history, occupation (except commercial use), income level, disability: prohibited via O. Reg. 664 (amended 2005) and FSCO's 2009 reminder that credit scoring for quoting/underwriting is "prohibited by law" [FETCHED] https://www.canadianunderwriter.ca/insurance/ontario-regulator-reminds-insurers-of-prohibition-on-use-of-credit-scoring-for-determining-auto-rate-1000091041/ (2009, updated 2024). Education counted in "credit information" definition under O. Reg. 7/00 (revoked 1 Apr 2022; replacement reportedly O. Reg. 208/22 - NOT verified). FSRA now uses principles-based Automobile Insurance Rating and Underwriting Guidance https://www.fsrao.ca/industry/auto-insurance/regulatory-framework/guidance-auto-insurance/automobile-insurance-rating-and-underwriting-guidance [SEARCH, not read]. Ontario gender: no prohibition found; FSRA annual review agenda lists "rating by gender" as a topic [UNVERIFIED].
Quebec:
- AMF does not impose/prohibit specific practices but reviews rating practices (LAA s.180) [SEARCH https://lautorite.qc.ca/en/professionals/insurers/automobile-insurance/]. Insurers must file rate manuals with AMF. A secondary summary of an AMF report says credit information can yield discounts up to 30% and surcharges up to 15% (credit use appears permitted in Quebec) [SEARCH - UNVERIFIED; PDF blocked]. Age/sex still cited as factors; whether sex rating is barred by the Quebec Charter is debated (Cahiers de droit 1998) - Ratehub says prohibited, others say used (men pay ~9.2% more) [UNVERIFIED conflict]. Treat gender as high-risk-of-noncompliance in Quebec until AMF/legal text is confirmed.
Alberta:
- Grid Rating System (repealed 1 Jan 2027) capped premiums; Good Driver Rate Cap (see 1.4); Superintendent's "Rating Factors Framework" (2013/2018) decides allowed factors [SEARCH, page 520]. Credit-score use: sources conflict (consent only / payment plans only / banned) [UNVERIFIED]; gender used by comparison sites [UNVERIFIED]. AIRB now has authority over underwriting rules (AR 227/2025) [FETCHED 588723] - underwriting declines for at-fault history are now regulated.
Federal: PIPEDA principle 4.3.3 limits consent-based collection of excess data [FETCHED via Canadian Underwriter above].
Model rule of thumb: do NOT include credit/insurance score, occupation, income, employment, education in Ontario; keep gender/age optional behind a switch for Quebec/Alberta until confirmed.

## 7. Fraud / staged accidents / early-claim indicators
7.1 Aviva Canada: staged collisions up ~400% 2024->2025. Hotspots GTA (Brampton, Toronto, Mississauga); emerging Ottawa, Markham, Calgary, Halifax. Indicators: swoop-and-squat, parking-lot wave-outs, sudden stops on known corridors, immediate involvement of unknown tow operators, collisions in fraud-prone locations, claims with injury/rehab/loss-of-income. [FETCHED] https://www.insurancebusinessmag.com/ca/news/auto-motor/staged-collisions-arent-a-side-show--theyre-reshaping-canadas-auto-loss-curve-569592.aspx - 2025-26 - Canada. Limit: one insurer's count; no dollar estimate in the page.
7.2 Equite (Bryan Gast): tow-sector networks - "it all starts with a tow"; Project Platinum (York Regional Police) - ~$4.2M assets recovered; charges later withdrawn. [SEARCH] https://www.insurancebusinessmag.com/ca/news/auto-motor/ontario-towsector-probe-shines-spotlight-on-systemic-auto-insurance-fraud-568476.aspx ; https://www.cp24.com/news/canada/2026/03/12/theres-money-to-be-made-insurance-fraud-among-allegations-in-tow-truck-violence/ . Limit: allegations; no Ottawa/Quebec specifics.
7.3 Chasers/referral fees from body shops (FSCO-related consumer guidance) [SEARCH]. Ambulance-chasing/clinic-referral quantification: NOT found.
7.4 Alberta: bodily-injury severity +36% since 2021 (AIRB) - injury-claim build-up is the Alberta fraud/leakage proxy until Care-First.
7.5 Early-claim indicators usable in a model (derived from 7.1; qualitative, no sourced relativities): reported-to-loss lag, tow operator not insurer-assigned, injury claimed on low-damage impact, claim in GTA/Brampton/Mississauga postal areas, multiple occupants, recent new policy/coverage change, theft with no keys/CAN-bus signs (re-VIN/chop shop and export per Equite 2025).

## 8. Candidate rating variables (direction and plausible relativity RANGE; only where sourced)
| Variable | Direction | Plausible relativity / range | Basis and confidence |
|---|---|---|---|
| Province/system (QC vs ON vs AB) | QC much lower liability cost | Premium roughly half of ON/AB (QC $1,067-$1,279 vs ON ~$2,120-$2,164, AB $1,903) | Sections 1,5; use separate models per line; AB Care-First -13.7% avg from 2027 (AIRB) |
| Alberta 2027 regime flag | Down | -13.7% avg; young male -30%; mid-age -14%; senior ~-20% | AIRB via 589266 (modelled) |
| Territory/postal: Toronto/GTA vs rural ON | Up in GTA | GTA $2,810 / other urban $2,076 / rural $1,740 -> ~1.6x GTA vs rural | [UNVERIFIED single secondary] |
| Ottawa vs Toronto | Down | $1,680/$2,348 = ~0.72 | MyChoice 2026 (single-profile quotes) |
| Montreal vs Quebec City | Mildly up | ~1.0x to ~1.36x | conflicting quote sources [UNVERIFIED] |
| Driver age 16-20 | Up | collision freq 9-11% vs 4.72% avg = ~1.9-2.3x | Insurance-Canada summary 2019 [SEARCH] |
| Driver age 21-24 | Up | 7-8% vs 4.72% = ~1.5-1.7x | same |
| Senior 75+ | Up (per km) | ~4% claim frequency in SAAQ BI data | SAAQ/Insurance Portal (qualitative U-curve) |
| Male vs female (young) | Male higher | 11% vs 9% (16-20); 8% vs 7% (21-24); Quebec men ~+9.2% premium | compliance-restricted; [UNVERIFIED] for Quebec |
| Vehicle make/model theft | Up for RAV4, CR-V, Dodge Ram, Highlander, Range Rover, Lexus RX/TX, luxury $200K+ | Luxury thefts +47.5% in 2024; 9/10 top stolen are SUV/trucks; theft RATE by model needed | Equite 2024 list [SEARCH] |
| Factory immobilizer / approved anti-theft | Down | -42% theft claim frequency (IBC 2000); -50% post-2007 (TC) | old; relay/CAN attacks erode; use cautiously |
| Winter season (Dec-Feb) | Up | collision rate 4.7% vs 3.1% (~1.5x) | Aviva 2011 [SEARCH] |
| Winter tires | Down | -6.3% collision frequency | MPI [SEARCH] |
| Calgary hail/cat load (comprehensive) | Up | no per-vehicle relativity; Aug 2024 ~70,000 vehicle claims, ~$1B | IBC [SEARCH] |
| GTA/Brampton/Mississauga/Ottawa fraud exposure | Up | no sourced relativity; Brampton theft cost +565% vs 2017 | IBC via 107677; Aviva staged-collision hotspots |
| Time trend (theft) | Down 2024-25, volatile | National -18% to -19%; ON -26% H1 2025; QC -22% to -25%; Toronto 2026 YTD +8.8% | Equite, Toronto Police |
| Credit score/occupation/income (ON) | NOT PERMITTED | - | O. Reg. 664 / FSCO |
| Credit info (QC) | Possibly permitted | up to -30% / +15% (secondary summary of AMF) | [UNVERIFIED] |

## 9. Highest-priority gaps to close with primary documents
1. AMF 2025 auto-rating report PDF (premiums by region/Montreal vs Quebec City, credit/age/sex rules) - blocked (403).
2. FSRA annual review / Rating & Underwriting Guidance - for Ontario age/territory/claims data and current prohibited list.
3. AIRB 2026 Annual Review PDF: https://www.airbfordrivers.ca/wp-content/uploads/2026/09/Alberta-Private-Passenger-Vehicles-2026-Annual-Review-Secured.pdf (city detail, BI share, coverage frequency/severity).
4. Equite 2024/2025 reports: per-model theft RATES and city-level counts (Montreal, Calgary, Quebec City).
5. GISA: Alberta claim frequency/severity by age, territory and coverage.
