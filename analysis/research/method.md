# Method references: insurance underwriting engine

Compiled 2026-11-14. Status tags: VERIFIED = page fetched and content confirmed this session. SEARCH-ONLY = seen in search snippets/secondary pages, not confirmed on primary page. UNVERIFIED = from memory or not retrievable; check before relying. Nothing below is legal advice.

---
## 1. Collective risk model / compound Poisson

- [VERIFIED] Wikipedia, "Compound Poisson distribution". https://en.wikipedia.org/wiki/Compound_Poisson_distribution
  Supports: S = sum_{i=1..N} X_i, N~Poisson(lambda) independent of iid X. E[S] = E[N]E[X] = lambda E[X]; Var(S) = E[N]E[X^2] = lambda E[X^2] (via laws of total expectation/variance). Cites Feller 1968 Vol I; Ross, Introduction to Probability Models; Jorgensen & Paes De Souza 1994 (Scand. Actuarial J. 1994(1):69-93) and Smyth & Jorgensen 2002 (ASTIN Bulletin 32(1):143-157) on Tweedie compound Poisson for claims.
- [VERIFIED] Wikipedia, "Ruin theory" (Cramer-Lundberg model). https://en.wikipedia.org/wiki/Ruin_theory
  Supports: surplus X_t = x + ct - sum_{i<=N_t} xi_i, Poisson(lambda) claim arrivals, mean claim mu. Cites Lundberg 1903; Gerber 1979 "An Introduction to Mathematical Risk Theory"; Asmussen & Albrecher 2010 "Ruin Probabilities" 2nd ed. (World Scientific); Rolski, Schmidli, Schmidt, Teugels 2008 (Wiley).
- Textbook anchors (not fetched; UNVERIFIED as to page content): Klugman, Panjer, Willmot, "Loss Models: From Data to Decisions" (Wiley, multiple editions) for collective risk model; Bowers et al., "Actuarial Mathematics" (SOA, 2nd ed. 1997).

## 2. LLN, Chebyshev, CLT and when pooling fails

- Chebyshev/CLT for pooling are standard probability results; no insurer-specific page fetched. Use Feller 1968 and Ross (cited above via Compound Poisson page, [VERIFIED as cited there]) for the theorems.
  Derivation (mine, from the formulas in section 1): for n iid policies, Var(mean loss)=Var(X_policy)/n, so the relative SD of the book falls as 1/sqrt(n). Chebyshev: P(|S-E[S]| >= k*SD) <= 1/k^2 (distribution-free).
- [SEARCH-ONLY] Jaffee, "Catastrophe insurance and regulation"/St. Louis Fed Review (06/07). https://files.stlouisfed.org/research/publications/review/06/07/Jaffee.pdf
  Supports (per search summary): with correlated risks, capital is required even as number of risks -> infinity; fat tails further weaken diversification. Fetch to confirm before quoting.
- [SEARCH-ONLY] Wharton Risk Center, "Policy Shock" ch. 3. https://impact.wharton.upenn.edu/wp-content/uploads/2018/01/PolicyShock_Chapter3.pdf
  Supports: insurability criteria (independence, large pool, etc.); violation makes disaster risk hard to insure.
- [SEARCH-ONLY] IRMI, "The Law of Large Numbers". https://www.irmi.com/articles/expert-commentary/the-law-of-large-numbers
- Parameter uncertainty as non-diversifiable risk: no authoritative page found. UNVERIFIED. Known fact from the model itself: if lambda is itself random (mixed Poisson, e.g. negative binomial), Var(S) gains a Var(lambda)*E[X]^2 term that does not shrink as 1/n (relative), derived by law of total variance; treat as derivation, not citation.

## 3. Credibility

- [VERIFIED] Wikipedia, "Credibility theory". https://en.wikipedia.org/wiki/Credibility_theory
  Supports: Buhlmann z = VHM/(VHM + EPV/n) = n/(n+k), k = EPV/VHM (EPV = expected process variance, VHM = variance of hypothetical means). Page does NOT mention limited fluctuation / 1082.
- [VERIFIED] Loss Data Analytics (open text, OpenActTexts), ch. 9 "Experience Rating Using Credibility Theory". https://openacttexts.github.io/Loss-Data-Analytics/ChapCredibility.html (authors/year not shown in fetch: UNVERIFIED)
  Supports: Buhlmann Z = n/(n+K), K = EPV/VHM. Limited fluctuation Poisson full-credibility standard lambda_kp = (y_p/k)^2 with y_p = Phi^-1((p+1)/2); non-Poisson n_f = lambda_kp * (var_N/mean_N). Text gives p=0.95,k=0.05 -> 1,537 (1,536.64). It does NOT show 1082.
- [SEARCH-ONLY, derivation checked arithmetically] 1082 standard: p=90%, k=5% -> y=1.645, (1.645/0.05)^2 = 1082.4 -> 1,082 claims. Sources surfaced by search (not opened): CAS RPM handouts (Otterman 2009, Doss 2011/2012) https://www.casact.org/sites/default/files/presentation/rpm_2009_handouts_otterman.pdf , https://www.casact.org/education/rpm/2011/handouts/WS1-Doss.pdf ; Boor, "Credibility for Overall Rate" https://casact.org/sites/default/files/2021-07/Credibility-Overall-Rate-Boor.pdf ; study-aid flashcards (weak source).
  Partial credibility: Z = min(1, sqrt(n/1082)). Severity standard multiplies by (1 + CV^2) (flashcard-level source only; check Boor).
- Why 13 Fire claims need shrinkage (derived from above): sqrt(13/1082) = 0.110, so ~11% weight on the segment's own experience under limited fluctuation; Buhlmann Z = 13/(13+K) depends on K (K must be estimated from data; not a cited constant). Use estimate = Z*segment + (1-Z)*complement (book-wide rate).
- Further reading (UNVERIFIED, not fetched): Buhlmann & Gisler, "A Course in Credibility Theory and its Applications" (Springer 2005); Buhlmann 1967 ASTIN Bulletin "Experience rating and credibility".
- Note: Wikipedia and the open text give different standards (none gives 1082); cite CAS handouts for 1082 after opening one.

## 4. GLM pricing (Poisson/NB frequency, Gamma/lognormal severity, exposure offset)

- [VERIFIED page, content limited] CAS Monograph No. 5, "Generalized Linear Models for Insurance Rating", 2nd ed., Goldburd, Khare, Tevet, Guller; CAS 2nd edition (copyright 2020; CAS catalogue lists 2025 revision; first edition 2016). ISBN 978-1-7333294-4-6. https://www.casact.org/monograph/cas-monograph-no-5 ; errata https://www.casact.org/sites/default/files/2026-02/Monograph_No_5_Errata_Sheet.pdf
  Supports: authoritative guide to building a rating plan with GLMs; on CAS Exam 8 syllabus. The PDF (https://www.casact.org/sites/default/files/2021-01/05-Goldburd-Khare-Tevet.pdf) could not be text-extracted by WebFetch, so specific claims (Poisson frequency, Gamma severity, log link, offset=ln(exposure), Tweedie) are from my knowledge of the monograph: UNVERIFIED this session; confirm in chapters 2-7 before quoting page numbers.
- [SEARCH-ONLY] CAS practitioner guide quoted in search: "Today GLMs are widely recognized as the industry standard method for pricing private passenger auto and other personal lines and small commercial lines insurance" (Anderson et al., "A Practitioner's Guide to Generalized Linear Models", CAS Discussion Paper Program 2004). https://casact.org/sites/default/files/database/dpp_dpp04_04dpp1.pdf (authors UNVERIFIED).
- [SEARCH-ONLY] Frees, "Pure Premium Modeling using GLMs" in Predictive Modeling Applications in Actuarial Science (Cambridge). https://www.cambridge.org/core/books/predictive-modeling-applications-in-actuarial-science/pure-premium-modeling-using-generalized-linear-models/64338CCA64C7FA38EA885B257CCE2112
  Supports: frequency/severity split vs pure premium (Tweedie).
- Tweedie compound Poisson-Gamma for pure premium: Jorgensen & Paes De Souza 1994; Smyth & Jorgensen 2002 (citations [VERIFIED as listed on Wikipedia page], papers themselves not opened).
- CIA: no Canadian Institute of Actuaries standard or educational note on GLM pricing was found. UNVERIFIED that CIA publishes one; check actuaries.ca (CIA Standards of Practice, ratemaking educational notes). Do not cite CIA for GLM until found.

## 5. Ruin, probability of loss, risk loading

- [VERIFIED] Wikipedia, "Ruin theory". https://en.wikipedia.org/wiki/Ruin_theory
  Supports: if premium rate c = lambda*mu (net premium), ruin probability is 1 in the infinite-horizon Cramer-Lundberg model; Pollaczek-Khinchine: psi(x) = (1 - lambda mu/c) sum (lambda mu/c)^n (1 - F_I^{*n}(x)); exponential claims: psi(x) = (lambda mu/c) exp(-(1/mu - lambda/c) x). Page does not give the net profit condition or Lundberg inequality explicitly (those: Asmussen & Albrecher 2010, UNVERIFIED here).
- [FETCH FAILED, 404] Wikipedia "Premium principle" URL did not exist. Standard deviation principle P = E[S] + a*SD(S) (and expected value P=(1+theta)E[S], variance P=E[S]+a*Var(S)): UNVERIFIED this session; source to open: Kaas, Goovaerts, Dhaene, Denuit, "Modern Actuarial Risk Theory" (Springer 2008, ch. 5 premium principles) or Gerber 1979.
- Why net premium is not enough: stated in Ruin theory page (c=lambda*mu -> ruin w.p. 1) [VERIFIED].
- Probability of loss for a book (normal approx, derivation): P(S > P_total) ~ 1 - Phi((P_total - E[S])/SD(S)); with SD loading a, = 1 - Phi(a). Caveat: normal approximation poor for skewed/heavy-tailed S and small books (see section 2); consider simulation or NP/gamma approximation.

## 6. Profit, underwriting margin, expected value per policy, CLV

- No authoritative page fetched. Definitions below are standard textbook ones; mark UNVERIFIED as citations.
  Underwriting result = earned premium - incurred losses - LAE - underwriting expenses; combined ratio = (losses + LAE + expenses)/earned premium; profit margin = 1 - combined ratio (ex investment income). Source to cite: CAS "Statement of Principles Regarding Property and Casualty Insurance Ratemaking" (CAS, 1988; adopted principles; UNVERIFIED URL) and IBC/OSFI/MSA reporting definitions (UNVERIFIED).
  Expected value per policy = P - E[X_total per policy] - E[expenses]. CLV = sum_t (EV_t * r_t) / (1+d)^t where r_t = retention probability (marketing/actuarial convention; no single authoritative source found).

## 7. "Difficult / high-maintenance" policyholders and legal limits (Canada)

### 7a. Measures insurers use (limited primary sourcing)
- Claim frequency, LAE per claim (ALAE/ULAE), dispute/litigation incidence, early-claim, non-renewal after claim: no authoritative Canadian source found for the combined definition of "difficult" customer. UNVERIFIED as an industry definition; treat as engine design choices, not regulatory concepts.
- [SEARCH-ONLY / secondary] Early-claim red flags: Canadian Underwriter, "Brokers pay attention to these insurance fraud red flags" (2021). https://canadianunderwriter.ca/2021/04/07/brokers-pay-attention-to-these-insurance-fraud-red-flags/ [VERIFIED fetch]: lists rushed purchase / immediate binding, undisclosed drivers, address mismatch, ghost brokering. It does NOT state a "claim within X days of inception" rule. The "30 days from inception" and "3+ flags -> SIU" rules came from low-quality checklist sites in search (e.g. app.manifest.ly checklist): UNVERIFIED, do not cite as industry standard. IBC anti-fraud reporting line exists (1-877-IBC-TIPS) [SEARCH-ONLY].
- Caution: high claim count != fraud. Fraud flags require investigation; auto-surcharging on a flag may be unfair-practice exposure (see 7b).

### 7b. Ontario
- [VERIFIED, secondary] iSure, "FSRA's take-all-comers rule". https://isure.ca/inews/fsras-take-all-comers-rule/
  Supports: Insurance Act ss. 237-238 prohibit declining, terminating or refusing to renew auto policies except on FSRA-approved (filed) underwriting criteria; Regulation 7/00 (UDAP) requires offering lowest available rate to eligible consumers; missed payments alone not valid basis unless FSRA-approved; location or non-fault claims should not disqualify. Written reason: page frames it as consumer step, not clearly mandatory. Brokerage page, not primary.
- [SEARCH-ONLY] FSRA, "Take-all-comers information (industry)" https://www.fsrao.ca/industry/auto-insurance/take-all-comers-information-industry and consumer version https://www.fsrao.ca/consumers/auto-insurance/take-all-comers-information-consumers (both returned 403 to WebFetch). Search summary: insurers must give all consumers timely quotes and the lowest rate available to them; FSRA lists contravening practices; FSRA review of the rules underway (consultation summary https://www.fsrao.ca/engagement-and-consultations/auto-insurance-take-all-comers-rule/auto-insurance-take-all-comers-requirements-consultation-summary). Rules may have changed: check.
- [SEARCH-ONLY] FSRA, "Why you have been declined insurance, your policy was not renewed or terminated" https://www.fsrao.ca/consumers/auto-insurance/purchasing-your-policy/why-you-have-been-declined-insurance-your-policy-was-not-renewed-or-has-been-terminated (403 on fetch). Primary-source candidate for lawful grounds.
- [SEARCH-ONLY] R.R.O. 1990, Reg. 664 "Automobile Insurance" s.5 "Refusal to issue contracts (s.237 of the Act)". https://www.ontario.ca/laws/regulation/900664 (page text did not load). Search summary: s.5(2) lists factors an insurer must not consider when issuing, renewing or terminating, including past claims (some kinds) and late/dishonoured premium payments. EXACT LIST UNVERIFIED: open e-Laws before coding any rule. Insurance Act statute: https://www.ontario.ca/laws/statute/90i08
- [SEARCH-ONLY] Facility Association (residual market): per search, every auto insurer in Ontario is a member and must follow Plan of Operation (subject to FSRA approval); applicants generally need a declination from a regular insurer; rates are higher (broker claim "2-3x": UNVERIFIED). FSRA ref: https://www.fsrao.ca/media/26041/download ; https://www.fsrao.ca/auto-insurance
- Note: the user phrase "good driver acceptance rules" did not match a named Ontario rule in search; the closest is take-all-comers. UNVERIFIED that a "good driver" rule exists by that name.
- [SEARCH-ONLY] Ontario Human Rights Code s.22 (formerly s.21): insurers may distinguish on age, sex, marital status, family status, disability only on "reasonable and bona fide" grounds, in individual contracts; OHRC: https://www.ohrc.on.ca/en/restrictions-insurance-contracts [VERIFIED that it summarises this, wording "reasonable and genuine grounds" in summary]; OHRC discussion paper https://www.ohrc.on.ca/en/discussion-paper-human-rights-issues-insurance ; Code https://www.ontario.ca/laws/statute/90h19. Zurich Insurance Co. v. Ontario (Human Rights Commission), [1992] 2 SCR 321 (SCC): insurers may rely on available statistics where no better data exist [SEARCH-ONLY; CanLII fetch 403]. Burden of proof on insurer (2023 ONSC 6594, SEARCH-ONLY).

### 7c. Quebec
- [SEARCH-ONLY, secondary] Groupement des assureurs automobiles (GAA): free intermediary for drivers refused by insurers; per CAA-Quebec, five refusals needed; its risk-sharing plan guarantees compulsory civil liability cover. https://www.caaquebec.com/en/press-room/news/having-trouble-insuring-your-vehicle-you-ve-got-options ; https://www.protegez-vous.ca/partenaires/groupement-des-assureurs-automobiles/vous-avez-de-la-difficulte-a-assurer-votre-vehicule
- [SEARCH-ONLY] AMF, Automobile FAQ https://lautorite.qc.ca/en/general-public/useful-links-and-frequently-asked-questions/automobile-faq (403 on fetch): compulsory civil liability min. $50,000; insurers must file rate manual with AMF; AMF collects auto experience data since 1981. AMF insurer page: https://lautorite.qc.ca/en/professionals/insurers/automobile-insurance/
- Cancellation (search summary, secondary): insurer may cancel within first 60 days for any reason, afterwards only on limited grounds, with written notice (15 days after receipt per AMF). Not verified against Civil Code of Quebec (art. 2566 et seq.) : UNVERIFIED. Quebec bodily-injury auto cover is public (SAAQ), so private insurers write liability for property damage and physical damage only (general knowledge, UNVERIFIED here).
- No primary source found for whether Quebec law obliges an insurer to accept an applicant (no take-all-comers equivalent found). UNVERIFIED; residual market (GAA) exists because refusals are lawful.
- [SEARCH-ONLY] Quebec Charter of Human Rights and Freedoms s.20.1 (added 1996, Bill 133): distinction based on age, sex, civil status in insurance is non-discriminatory if warranted/based on actuarial risk factor; CDPDJ plain-language page https://cdpdj.qc.ca/en/your-obligations/prohibited-practices/discrimination ; statute https://www.legisquebec.gouv.qc.ca/en/document/cs/C-12 . Exact wording UNVERIFIED.

### 7d. Proxy discrimination / fairness (engine implications)
- No authoritative Canadian source fetched on proxy discrimination in pricing. UNVERIFIED. Practical rule derived from sources above: protected-ground rating (age, sex, civil status, disability etc.) is only allowed under the Code s.22 / Charter s.20.1 risk-based carve-outs; race, religion, national/ethnic origin etc. are not covered by those carve-outs (inference from Code structure; verify). Using postal code/occupation/etc. as proxies for protected grounds is a risk; check with counsel.
- Design implication: an engine that "declines difficult customers" in Ontario auto must tie any decline/surcharge to filed (FSRA-approved) criteria; in other lines (home, e.g. Fire) there is no take-all-comers rule found, but human-rights limits and unfair-practices rules apply. Whether the user's data is auto or property is not stated; confirm line of business.

---
## Formula sheet (with source)

| # | Formula | Source / status |
|---|---|---|
| F1 | S = sum_{i=1..N} X_i, N~Poisson(lambda) indep. of iid X | Compound Poisson (Wikipedia) VERIFIED |
| F2 | E[S] = E[N]E[X] = lambda E[X] | same, VERIFIED |
| F3 | Var(S) = lambda E[X^2] = lambda (Var X + E[X]^2) | same, VERIFIED |
| F4 | General N: Var(S) = E[N]Var(X) + Var(N)(E[X])^2 | law of total variance; derivation (UNVERIFIED as citation) |
| F5 | Chebyshev: P(abs(S-ES) >= k SD) <= 1/k^2 | standard theorem; Feller 1968 (UNVERIFIED page) |
| F6 | Book relative SD (n iid policies) = CV_policy / sqrt(n) | derivation |
| F7 | Buhlmann Z = n/(n+K), K = EPV/VHM; estimate = Z*own + (1-Z)*complement | Credibility theory (Wikipedia), Loss Data Analytics VERIFIED |
| F8 | Full credibility (Poisson): n_F = (y_p/k)^2, y_p = Phi^-1((1+p)/2); p=.90,k=.05 -> 1082 (1082.4) | Loss Data Analytics formula VERIFIED (its example is p=.95 -> 1537); 1082 SEARCH-ONLY |
| F9 | Partial credibility Z = min(1, sqrt(n/n_F)) | CAS handouts SEARCH-ONLY |
| F10 | Frequency GLM: N_i ~ Poisson(mu_i), ln(mu_i) = ln(exposure_i) + x_i'beta (offset) | CAS Monograph 5; UNVERIFIED this session |
| F11 | Severity GLM: X ~ Gamma, ln(E[X]) = x'beta (or lognormal on ln X); weights = claim counts | CAS Monograph 5; UNVERIFIED this session |
| F12 | Pure premium = frequency x severity (or Tweedie) | Frees; Jorgensen & Paes De Souza 1994 (citations VERIFIED, papers not opened) |
| F13 | Net premium c = lambda mu -> ultimate ruin prob = 1 | Ruin theory (Wikipedia) VERIFIED |
| F14 | Pollaczek-Khinchine ruin formula (see section 5) | Ruin theory (Wikipedia) VERIFIED |
| F15 | SD principle: P = E[S] + a SD(S); EV principle P=(1+theta)E[S]; variance principle P = E[S]+a Var(S) | Kaas et al. 2008; UNVERIFIED this session (Wikipedia URL 404) |
| F16 | Prob(book loss) ~ 1 - Phi((P - E[S])/SD(S)); = 1 - Phi(a) under F15 SD loading | derivation, normal approximation |
| F17 | Combined ratio = (loss + LAE + expense)/earned premium; margin = 1 - CR | standard definition, UNVERIFIED citation |
| F18 | EV per policy = P - E[loss] - E[LAE] - E[expense]; CLV = sum_t EV_t S_t / (1+d)^t (S_t=survival/retention) | convention, UNVERIFIED citation |

## Items to open before relying (priority)
1. Reg. 664 s.5 and Insurance Act ss.237-238 on e-Laws (exact prohibited factors, claims treatment).
2. FSRA take-all-comers pages (403 to WebFetch; open in browser) and current review outcome.
3. CAS Monograph 5 PDF chapters on offset/Poisson/Gamma (text extraction failed).
4. CAS handout/Boor paper for 1082 and severity multiplier.
5. Kaas et al. or Gerber for premium principles; Asmussen & Albrecher for Lundberg inequality.
6. Quebec: Civil Code/Act respecting insurance on refusal and cancellation; Charter s.20.1 wording.
7. CIA guidance on ratemaking (actuaries.ca): none found.
