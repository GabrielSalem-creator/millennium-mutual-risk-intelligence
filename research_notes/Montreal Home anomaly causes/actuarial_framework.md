# Actuarial and statistical framework

## What is needed to establish profitability?

### Takeaway
The supplied policy and claim extracts can support descriptive anomaly screening, but not a defensible profit calculation or a pricing conclusion. A matched-period profit bridge needs earned premium, exposure, ultimate incurred claims (including claim expenses and development), operating costs, reinsurance, and investment income; then comparisons can be decomposed by product, peril, time, and territory.

### Cited Findings
- The loss ratio is incurred losses divided by earned premiums; insurance loss reserves cover reported unpaid and incurred-but-not-reported claims. [NAIC Glossary](https://content.naic.org/glossary-insurance-terms?id=37)
- Canadian CIA P&C standards define claim liabilities to include case estimates, development on reported claims (including claim adjustment expenses), and IBNR (including claim adjustment expenses); selected methods depend on circumstances and their assumptions. [CIA Standards of Practice, archived P&C section 2200](https://www.cia-ica.ca/app/themes/wicket/custom/dl_file.php?fid=32707&p=37243)
- OSFI’s 2026 Minimum Capital Test describes insurance risk as uncertainty in both ultimate net cash flows from premiums, commissions, claims and settlement expenses, and their timing. It separates incurred-claim liability risk from unexpired-coverage underwriting risk, catastrophe risk and other risks. [OSFI MCT Guideline 2026](https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/minimum-capital-test-guideline-2026)
- The supplied files have annual premium, claim amount, paid amount, status and dates, but (per the local supplied CSV schema) lack coverage end/cancellation dates, earned premium by period, case reserves, IBNR, loss-adjustment expense, operating/acquisition expense, reinsurance and investment income. Source files: `/Users/gabrielsalem/Downloads/MillenniumMutual_Insurance_Data/policies.csv` and `/Users/gabrielsalem/Downloads/MillenniumMutual_Insurance_Data/claims.csv`.
- A useful underwriting bridge, once these fields exist, is: underwriting result = earned premium − ultimate incurred loss and LAE − acquisition/operating expenses − reinsurance cost (with ceded recoveries consistently accounted for). Total pre-tax result additionally reflects investment income and other items; use consistent gross/net and accounting definitions. Loss ratio = (ultimate incurred losses + included LAE) / earned premium, with exact numerator definition documented. [NAIC Glossary](https://content.naic.org/glossary-insurance-terms?id=37); [CIA Standards](https://www.cia-ica.ca/app/themes/wicket/custom/dl_file.php?fid=32707&p=37243)

### Inferences
- Written annual premium cannot be compared directly with claims incurred across a different/overlapping date window to identify profit; it can create an apparent margin that disappears after earning, claim development, expense, and reinsurance are aligned.
- The first new data request should be policy-coverage-period exposure and earned premium by accounting/accident period, plus claim-level paid-to-date, case reserve, recovery, adjustment expense, status, and valuation date. The system should show exactly which denominator or liability component blocks each requested metric.

### Gaps
- The supplied extracts do not provide consistent accounting definitions, currency, underwriting year/accident year mapping, reserve snapshots, claim-development triangles, expense allocation, reinsurance terms, or investment returns; profit cannot be calculated until reconciled against finance/actuarial records.
- This review is analytical guidance, not an actuarial opinion, audited result, or rate filing.

## How should city/peril signals be tested and stabilized?

### Takeaway
Compare loss cost using matched, earned exposure and distinguish frequency from severity before interpreting a Montreal–Toronto gap. Credibility and uncertainty should temper small cells; aggregate loss math is useful for long-run expectations, but independence, stationarity, finite variance, and diversification can fail under catastrophe or common weather shocks.

### Cited Findings
- CAS ratemaking principles describe rate-making as estimating costs associated with transferring risk and emphasize appropriate actuarial procedures to support financial soundness, equity and availability. [CAS Statement of Principles Regarding P&C Insurance Ratemaking](https://www.casact.org/abstract/statement-principles-regarding-property-and-casualty-insurance-ratemaking)
- A conventional collective risk model represents aggregate loss as S = X₁ + … + X_N, with claim count N and severities X. Under the model’s assumptions, E[S] = E[N]E[X] and Var(S) = E[N]Var(X) + Var(N)E[X]². [CAS, Insurance Applications of Bivariate Distributions](https://forum.casact.org/article/171147-insurance-applications-of-bivariate-distributions)
- For Poisson claim count with independent identical claim severities, Var(S) = λ E[X²] = λ(Var(X)+E[X]²); model choice and dependence matter. A CAS paper documents positive frequency–severity dependence in one six-year Singapore auto portfolio, which is evidence against blindly assuming independence, not proof that dependence exists in this dataset. [CAS Forum, When a Portfolio Reaches Sufficient Scale](https://forum.casact.org/article/154566-when-a-portfolio-reaches-sufficient-scale); [CAS, Generalized Linear Mixed Models for Dependent Compound Risk Models](https://www.casact.org/abstract/generalized-linear-mixed-models-dependent-compound-risk-models)
- In Bühlmann credibility, Z = n/(n+K), where K is the ratio of expected process variance to variance of hypothetical means; CAS notes the parameters may be modelled or estimated and the estimate itself is subject to model error or sampling variation. [CAS Credibility Review](https://www.casact.org/sites/default/files/2021-03/8_Fisher_et_al.pdf)
- Chebyshev’s inequality gives P(|X̄−μ| ≥ a) ≤ σ²/(n a²) for independent, identically distributed observations with finite variance (same means/variances also suffice for the variance-of-mean step). Solving for an additive error tolerance a at confidence 1−α yields n ≥ σ²/(αa²). This is a conservative bound, not a forecast of real insurance loss volatility. [UC Berkeley EECS 70 notes](https://www.sp18.eecs70.org/static/notes/n18.html)
- FSRA’s Ontario auto guidance expects rating assumptions to be reasonable and realistic, changes to align with claim-cost change, validation of prior-year development, and fairness/proxy-impact assessment. This guidance is jurisdiction- and product-specific: it is not by itself a Quebec/Home regulatory rule. [FSRA Automobile Insurance Rating and Underwriting Guidance](https://www.fsrao.ca/industry/auto-insurance/regulatory-framework/guidance-auto-insurance/automobile-insurance-rating-and-underwriting-guidance)
- FSRA’s Ontario Territory Guidance discusses protected-class impact testing, including control-variable and Fair GLM approaches. It explicitly concerns the Ontario auto framework; it is useful as a model-governance example, not as a substitute for the applicable Quebec/Home rules. [FSRA Territory Guidance – Principles-Based Framework](https://www.fsrao.ca/media/24221/download)

### Inferences
- Recommended hierarchy: (1) normalize exact city labels and audit claim links/duplicates, (2) compare Home peril counts and reported severity, (3) calculate claim frequency per earned property-year and claim cost per earned exposure, (4) adjust for property/coverage/deductible/risk mix and calendar/accident period, (5) estimate uncertainty and credibility, (6) only then assess rate adequacy with qualified actuarial/regulatory review.
- Show city signals as observed counts, exposure denominator, frequency, severity, pure premium, confidence interval/credibility, and comparison baseline. Do not sort a city to the top solely because it has the largest raw claims total.
- For independent annual aggregate losses Sᵢ with common mean μ and finite variance σ², LLN says the sample average converges to μ as n grows; this does not guarantee a profitable result in each year or protect against trend shifts, inflation, catastrophes, dependence, changing portfolio mix, or underestimated tail risk.
- Chebyshev sample sizes become especially large when variance is high or the tolerated absolute error is small. The software must not present the bound as a magical “enough data” answer unless the variance estimate, unit of exposure, confidence target, and independence assumptions are visible.
- Catastrophe and weather can correlate claims across policies; cluster-level resampling, catastrophe scenarios, or explicit temporal/spatial dependence may be needed instead of an iid cell standard error. This is a modelling implication and must be tested against local data.

### Gaps
- Actual Montreal-vs-Toronto adjusted frequency/severity needs earned exposure, geocoded or consistent territorial location, exact coverage/peril, property construction/age/protection, insured values/limits/deductibles, claim maturity and recoveries. City-level policy counts are insufficient.
- Credibility constant K or full-credibility threshold cannot be responsibly chosen from raw claim counts alone; it depends on process variance, between-risk heterogeneity, target error and the chosen exposure unit.
- Chebyshev requires finite variance and independent sampling (or a separately justified variance bound). Heavy-tailed property losses, catastrophe dependence and trend breaks can make a simple plug-in sample variance unstable.

## What decisions and fairness controls are appropriate?

### Takeaway
Treat anomaly detection as a trigger for investigation, not an automatic cause or price change. The first actionable decisions should improve data and claim insight, test loss-prevention or service interventions, and validate rate adequacy only after exposure-adjusted, mature loss evidence and applicable regulatory/fairness review.

### Cited Findings
- CAS ratemaking principles emphasize sound actuarial procedures in the development and review of P&C rates, with objectives that include both financial soundness and equity/availability. [CAS Ratemaking Principles](https://www.casact.org/abstract/statement-principles-regarding-property-and-casualty-insurance-ratemaking)
- FSRA says Ontario auto rating data and models should relate to the assumed risk, avoid arbitrary factors and unfair discrimination, and be tested for bias and indirect proxies; it calls for transparent, explainable and validated decisions. [FSRA Auto Rating and Underwriting Guidance](https://www.fsrao.ca/industry/auto-insurance/regulatory-framework/guidance-auto-insurance/automobile-insurance-rating-and-underwriting-guidance)
- FSRA’s territorial guidance gives examples of multivariable testing to detect protected-class effects in territory and other rating factors. [FSRA Territory Guidance](https://www.fsrao.ca/media/24221/download)

### Inferences
- A ranked observation should carry evidence class (measured / modeled / external context / hypothesis), the precise source fields and period, denominator, sample size, uncertainty, counter-hypothesis, and a “data needed” action. Recommendations should state goal, treatment/control design, guardrails, expected mechanism and outcome metric.
- Safe first experiments: inspect claim files/reserve adequacy; offer water-loss prevention to eligible properties and measure take-up plus mature loss outcomes; improve renewal/claims service after identifying friction; or test a transparent, customer-benefiting experience change. Do not claim an experiment improves profit until a pre-registered comparison measures incremental ultimate loss/expense and customer outcomes.
- The user’s idea of adding demographic or cultural segmentation should be reframed: collect only lawful, necessary, consented, demonstrably risk-relevant data; do not infer ethnicity/culture, age-based purchasing propensity, wealth, health, hospitalization or mortality to ration insurance/credits or set prices. Use actuarially relevant property/vehicle, coverage, exposure, peril, and documented behavior where lawful, and test direct/indirect proxy effects under the applicable provincial rules.
- External statistics can help generate hypotheses (e.g., weather/peril context), but should be joined at matching geography/time/exposure and not treated as an explanation unless the local portfolio analysis supports that link.

### Gaps
- The insurer’s domicile, licensed provinces, line-specific filing obligations, governance, existing rate plan and customer-data permissions are not established. Ontario auto guidance cannot be generalized to Quebec home insurance.
- No experiment baseline, outcome/guardrail definitions, assignment mechanism, or sufficiently mature follow-up window has been provided; effect sizes and profit uplift remain unknown.
