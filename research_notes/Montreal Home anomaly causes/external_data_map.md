# Public data for regional Home claim analysis

## Which external datasets can test weather, flood and property-mix hypotheses?

### Takeaway

There are useful public Canadian sources for weather, flood susceptibility and housing composition. They can prioritize and test plausible explanations only after claims are joined to insured location, loss date, peril and earned exposure; broad city-level overlays cannot establish a cause or an individual property's risk.

### Cited Findings
- Environment and Climate Change Canada (ECCC) Historical Climate Data offers Canadian station-based hourly, daily and monthly observations, including precipitation, temperature, wind and extremes. The map search includes station metadata and downloadable station results; a practical link key is a geocoded insured property (or postal code centroid) to nearby stations and claim loss date, with station distance/elevation and missingness retained. [ECCC Historical Data](https://www.climate.weather.gc.ca/historical_data/search_historic_data_e.html), [ECCC map search](https://climate.weather.gc.ca/map/index_e.html)
- ECCC says availability and intervals vary by station; downloads can be CSV/XML, but daily downloads are limited to a year at a time and hourly data are generally retrieved one month at a time through the page. Blank values mean unavailable observations, so station coverage and missingness need to be checked before comparing Montréal and Toronto. [ECCC FAQ](https://climate.weather.gc.ca/FAQ_e.html)
- NRCan's Flood Susceptibility Mapping has annual historic maps for 2000–2023, derived from a model trained on major floods and using weather, land cover, vegetation and other inputs. NRCan explicitly says the maps are for regional/national screening, not prediction at an individual property or engineering/building design. The useful join is property coordinates to raster cell and claim loss year, followed by exposure-weighted rates. [Historic Flood Susceptibility](https://open.canada.ca/data/en/dataset/ea1384df-bf4a-4743-97bb-870dc43f8d77), [collection and intended use](https://open.canada.ca/data/en/dataset/1074f781-85d3-4c86-86cb-fd1c339197dc)
- NRCan's Canada Flood Map Inventory catalogs where hazard maps exist and how to access them; coverage, map owner, age and availability are not uniform across Canada. It can identify local authoritative products, but the inventory is not itself a complete countrywide flood-depth model. [Canada Flood Map Inventory](https://open.canada.ca/data/en/dataset/a13a2575-5bda-4bfd-a9b1-5bd2dd583f09), [NRCan flood mapping data index](https://natural-resources.canada.ca/science-data/science-research/natural-hazards/flood-mapping/data-related-flood-mapping)
- Statistics Canada's 2021 Census Profile can be downloaded at census tract and dissemination-area levels and includes dwelling/housing characteristics. The geography can contextualize housing stock and neighborhood mix when crosswalked to policy postal codes/coordinates; it is a decennial snapshot, not building-level underwriting data and may be stale for the dataset's 2024–2026 period. [Census Profile downloads](https://www150.statcan.gc.ca/n1/en/catalogue/98-401-X), [2021 Census Profile geographies](https://www150.statcan.gc.ca/n1/en/catalogue/98-401-X2021012)
- The Census dictionary notes geographic boundaries can change between census years, so comparisons must use compatible geography or a documented boundary crosswalk. [2021 Census Dictionary](https://www12.statcan.gc.ca/census-recensement/2021/ref/dict/98-301-x2021001-eng.pdf)

### Inferences
- For a Home Water Damage signal, the priority external enrichment is geocoded property location + loss date matched to rainfall/temperature and flood susceptibility, then stratification by basement, building age/type, occupancy, plumbing/mitigation, insured value, deductible and coverage. A city label alone cannot separate hazard from insured portfolio mix.
- Treat NRCan susceptibility as a screening covariate, not proof that a claim was flood-caused. Check event-level local maps, claim cause codes, and whether the policy actually covers that water peril.
- Use the year-by-year public flood layers that overlap the claims window; avoid implying the 2000–2023 maps explain claims in 2024–2026 without current local hazard data.

### Gaps
- No insured postal codes, addresses, coordinates, property attributes, peril-specific coverage, or earned exposure are present in the provided policies/claims CSVs; exact spatial matching cannot yet be done.
- Public climate observations do not measure each insured property's basement, drainage, maintenance, mitigation, or actual water ingress.

## What public crime and insurance-loss data are available?

### Takeaway

Public data can add market and regional context, but detailed private Home claim experience is generally not an open, record-level dataset. Public crime measures are imperfect proxies for insured theft losses, and catastrophe summaries cannot substitute for the insurer's exposure and ultimate-claim data.

### Cited Findings
- Statistics Canada's Uniform Crime Reporting tables publish annual incidents, rates and Crime Severity Index at the province, territory and Census Metropolitan Area levels, including detailed violations. A potential broad comparison is Montréal CMA vs Toronto CMA by theft/break-and-enter and year; use only as context, since police-reported offenses are not insured Home claims and do not identify insured properties or insurance coverage. [Table 35-10-0177-01](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3510017701), [Police-reported Information Hub notes](https://www150.statcan.gc.ca/n1/pub/71-607-x/71-607-x2023026-eng.htm)
- Statistics Canada cautions that policing-based CMA boundaries used in UCR data do not always align with standard Census CMA geographies. The two cities' crime series therefore need geography/version checks before comparative analysis. [Police-reported Information Hub notes](https://www150.statcan.gc.ca/n1/pub/71-607-x/71-607-x2023026-eng.htm)
- IBC publishes national insured-loss summaries and event-level catastrophe information. It reported $8.5B in insured damages in 2024, but those figures describe large-scale insured losses rather than the claim-level exposure, location and policy mix needed to explain Millennium Mutual's own regional results. [IBC data hub](https://www.ibc.ca/industry-resources/industry-impact-and-data-hub), [IBC 2024 severe-weather losses](https://www.ibc.ca/news-insights/news/2024-shatters-record-for-costliest-year-for-severe-weather-related-losses-in-canadian-history-at-8-5-billion)
- OSFI's open-data portal publishes P&C companies' regulatory returns, which can support company/industry-level financial context and ratios when the return definitions and reporting periods are understood. They do not provide granular open Home claims by municipality and peril. [OSFI P&C company returns](https://open.canada.ca/data/en/dataset/4c6c515f-7c44-4bb6-ab56-c5f79f75f705)
- CGI describes its Habitational Insurance Tracking System (HITS) as an insurer-facing source of Canadian personal-property claims information including Quebec. This is a commercial/industry-access source, not an open dataset. [CGI Property Risk Services](https://www.cgi.com/canada/en-ca/insurance/property-risk-services)

### Inferences
- A broad crime-rate association with the portfolio's Theft claims could motivate a better question, but cannot establish that higher neighborhood crime caused higher insured losses: reporting behavior, policy penetration, coverage, insured values, claim propensity and geography differ.
- Open external data should be labeled `context`, `screening`, or `matched evidence`; only insurer data with earned exposure and claim development can directly support portfolio loss conclusions.
- The highest-value next step is to request internal property claims history and location-level policy exposure; commercial industry datasets may help benchmark but require licensing, privacy review and definitions alignment.

### Gaps
- I did not find a public, granular Canadian Home insurance dataset with claim-level location, peril, paid/incurred loss and exposure for direct Montréal–Toronto insurer comparisons.
- The specific downloadable IBC material and its exact municipality/peril coverage should be verified before assuming it can answer a portfolio question.

## Should cultural, age, mortality or hospital statistics be used as predictors?

### Takeaway

These are not credible causal inputs for property damage from the supplied data. Cultural, ethnicity, health or mortality variables risk acting as proxies for protected or vulnerable groups; any segmentation or pricing use would need a demonstrable insurance-risk rationale, jurisdiction-specific actuarial/legal review and fairness testing. They should not be used to infer who is a likely buyer or to ration service/coverage.

### Cited Findings
- Canadian actuarial research describes insurance pricing as a tension between actuarial fairness and solidarity and identifies proxy effects as a specific fairness concern. [Statistical Perspective on Fairness in Insurance Pricing](https://www.annualreviews.org/content/journals/10.1146/annurev-statistics-042925-075327)
- Recent actuarial research on proxy discrimination explains that variables not explicitly protected can indirectly encode protected information, and develops methods to measure those effects in pricing systems. [CAS, A Scalable Toolbox for Exposing Indirect Discrimination in Insurance Rates](https://www.casact.org/sites/default/files/2025-10/_A_Scalable_toolbox_working_paper.pdf)
- Statistics Canada's Census Profile may contain age, ethnicity, language, income and other neighborhood characteristics, but their availability at an aggregate geography does not establish a causal relation to Home claim frequency/severity. Geographic aggregation also risks ecological inference: a neighborhood average does not describe an individual insured. [Census Profile downloads](https://www150.statcan.gc.ca/n1/en/catalogue/98-401-X)

### Inferences
- For Home losses, model property and peril mechanisms directly: insured building features, verified hazards, protection/mitigation, coverage terms and earned exposure. Mortality and hospital utilization measure human health outcomes, not property-loss processes, and would be especially inappropriate as substitutes for missing property attributes.
- Cultural/ethnic data can at most be considered in a controlled fairness audit when legally and ethically permitted; never use them to infer an individual buyer's wealth, propensity to purchase, or to allocate fewer credits/benefits.
- For the Montréal–Toronto comparison, prioritize property-specific evidence and test alternative explanations (portfolio mix, claim-reporting/handling, coverage/deductible, event timing, data quality) before regional pricing decisions.

### Gaps
- This is a data-science research note, not legal advice; applicable rating rules differ across Canadian provinces, products and uses. Any deployment requires jurisdiction-specific counsel and credentialed actuarial review.
- No validated evidence found in this research directly links cultural group, age, mortality or hospital use to the particular Home claims in the supplied dataset.
