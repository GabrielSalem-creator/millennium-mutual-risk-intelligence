# Web behavior instrumentation and ethical optimization

## What can browser events tell us about pricing-plan behavior across desktop and mobile?

### Takeaway

Treat plan visibility, pointer movement, taps, and purchases as separate observable events. A hover or a visible card is only a weak behavioral signal; neither proves attention, preference, willingness to pay, or intent. Use mobile viewport exposure and explicit interactions instead of pretending touch has hover.

### Cited Findings

- Intersection Observer reports geometric intersection between a target and a viewport/root, with a ratio from 0 to 1 and callbacks at configured thresholds. It does not observe where a person is looking. [MDN: Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- The Page Visibility API reports whether a document is visible or hidden, allowing a measurement window to pause while the tab is in the background. MDN notes `blur`/`focus` do not reliably indicate whether a page is actually hidden. [MDN: Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- Pointer Events expose `pointerType` values such as mouse, pen, or touch, but the value may be empty when the device type is unknown. [MDN: PointerEvent.pointerType](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pointerType)
- A lab study of 36 participants across 32 web-search tasks found gaze-to-cursor alignment varied with browsing style and time; the cursor can lag gaze, and idle cursor position is a poor indicator of gaze. This is a search study, not a pricing-page study. [Huang et al., CHI 2012](https://jeffhuang.com/papers/GazeCursor_CHI12.pdf)
- GA4's ecommerce event guidance distinguishes list exposure (`view_item_list`) from choosing a particular item (`select_item`) and subsequent funnel events. This is a useful event-taxonomy precedent, not evidence that these events mean attention or intent. [Google Analytics: Measure ecommerce](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)

### Inferences

- Record `pricing_plan_exposure` only when (for example) at least 50% of a plan is geometrically visible for one continuous second while the document is foregrounded. Call this *qualified exposure*, not a view or attention. Store visible-time in coarse buckets; do not collect gaze-like coordinates.
- On mouse/pen-capable devices, optionally record `pricing_plan_pointer_enter` and a coarse `pointer_dwell_ms_bucket`. Label it pointer interaction/dwell. Do not call it interest. Avoid raw cursor paths.
- Record explicit `pricing_plan_select` / CTA activation separately. On touch devices, use the same exposure event plus actual taps; do not synthesize hover from scroll.
- A row-versus-column layout is a testable design hypothesis. Measure exposure by plan, selection, checkout, purchase, contribution margin, completion success, and accessibility/task-success guardrails. Do not optimize raw scroll depth; a layout that forces scrolling can inflate it without improving understanding.
- Example minimal event envelope: `event_name`, `occurred_at`, `site_id`, `page_id`, `page_variant`, short-lived pseudonymous `session_id`, `experiment_id`/`variant_id`, `device_class`, `pointer_type`, `consent_state`, `schema_version`. Event-specific plan fields: `plan_id`, `slot_position`, `intersection_ratio_bucket`, `visible_ms_bucket`, `foreground`, and explicit `action_id` where applicable. Avoid a persistent cross-site identity unless there is a separately justified and disclosed need.

### Gaps

- No VDO-X event data was accessed for this research. Whether plan 3 receives more exposure, pointer dwell, selection, or conversion than other plans is unknown.
- Browser viewport exposure cannot establish what a person read or understood. A valid attention measure would require a separately consented research protocol (for example, a voluntary usability study), and would not be suitable as routine surveillance.

## How should credit-limit and paywall timing be instrumented and tested?

### Takeaway

A “show the paywall when the user is enjoying generation” idea is a hypothesis, not a proven VDO-X insight. Instrument the product lifecycle and test timing at clear, user-understandable credit boundaries; evaluate durable customer outcomes and user-harm guardrails, not just immediate conversion.

### Cited Findings

- A randomized field experiment on a real SaaS image-editing service included 680,588 users across nearly 190 countries over two years and compared 3-day with 7-day free trials. Its reported findings show trial length can change adoption and conversion timing, while immediate conversion did not show a statistically significant improvement. This is evidence that timing effects can be multi-stage; it does not test VDO-X credits or paywall triggers. [Frontiers, 2025](https://doi.org/10.3389/fpsyg.2025.1568868)
- A Journal of Marketing randomized field experiment on a non-advertising app tested hard/soft paywall landings and premium secondary offers; the outcomes depended on the combination of interventions. This cautions against assuming a seemingly intuitive paywall change will work in isolation. [Lambrecht et al., 2023](https://doi.org/10.1177/00222437221131562)
- Microsoft recommends a holistic experiment metric set including user-satisfaction metrics, guardrail metrics, feature/engagement metrics, and data-quality metrics; example guardrails include page-load time, crash rate, and abandonment. [Microsoft Research: Pre-experiment patterns](https://www.microsoft.com/en-us/research/articles/patterns-of-trustworthy-experimentation-pre-experiment-stage/)
- The FTC's dark-patterns report describes interface practices that impair consumer choice, including obscuring privacy choices and designs that trick or trap people into subscriptions. [FTC: Bringing Dark Patterns to Light](https://www.ftc.gov/reports/bringing-dark-patterns-light)

### Inferences

- Suggested lifecycle events: `generation_started`, `generation_completed`, `generation_failed`, `credits_balance_bucket_changed`, `paywall_shown`, `paywall_dismissed`, `checkout_started`, `purchase_completed`, `refund_or_credit_reversal`. Include `trigger` values such as `user_opened`, `low_balance`, `balance_exhausted`, `feature_gate`; include elapsed time since last successful generation as a bucket, not a detailed behavioral trace.
- Do not transmit prompts, generated media, payment credentials, email, free-text responses, or exact location in analytics events. Keep billing data in the payment/billing system and use a minimal join key only if justified and access-controlled.
- A fair timing experiment could compare an immediate clear notice at a user-initiated limit with a non-interruptive notice after the completed generation. Keep remaining credits, price, recurring terms, dismiss action, and purchase action clear in every arm. Avoid surprise popups that interrupt generation or imply false scarcity.
- Define primary outcomes before launch: paid conversion and contribution margin over a suitable follow-up window. Include guardrails: successful generation rate, ability to finish a free task, paywall dismissals, checkout abandonment, refunds/chargebacks, complaints, repeat usage, latency, and accessibility/task success. Stop or roll back if guardrails worsen materially.
- An observation such as “users often exhaust credits after several successful generations” should produce an explanatory signal and a menu of testable choices, not automatic pricing or credit changes. Present the sample size, period, denominator, uncertainty, and whether it is correlational or randomized.

### Gaps

- No primary research found establishes the optimal number of generated videos or exact moment for a VDO-X paywall. The trigger should be learned through a transparent controlled experiment using VDO-X's own consented data.
- The cited field experiments vary in product, monetization model, market, and implementation. Their effects cannot be transferred as a numeric forecast for VDO-X.

## What data collection, privacy, and personalization guardrails should the system use?

### Takeaway

Collect only events needed to answer a named product question, disclose the purpose, and honor the applicable consent/choice rules. Avoid inferring age, wealth, or “buyer type” from behavior to change price or ration credits; use user-selected preferences and non-sensitive session context for helpful presentation, while keeping core terms consistent and transparent.

### Cited Findings

- Google Analytics policy prohibits sending personally identifiable information such as email addresses and phone numbers, and warns that URLs, titles, form fields, or custom dimensions can inadvertently contain such data. [Google Analytics: PII policy](https://support.google.com/analytics/answer/6366371?hl=en)
- EDPB guidance says when consent is the legal basis, consent must be freely given, specific, informed, and unambiguous; people need a real choice, sufficient information, granular choices, and a way to withdraw without negative consequences. Applicability and legal basis depend on jurisdiction and processing. [EDPB: Data protection basics](https://www.edpb.europa.eu/sme/learn-the-basics/data-protection-basics_en)
- The UK ICO Children’s Code says profiling options should be off by default for services likely to be accessed by children unless a compelling reason supports another default, considering children’s best interests. [ICO: Profiling](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/12-profiling/)
- The FTC report documents how asymmetric or obscured interface choices can steer people toward sharing data or subscribing. [FTC: Bringing Dark Patterns to Light](https://www.ftc.gov/reports/bringing-dark-patterns-light)

### Inferences

- Provide a plain-language analytics notice and an accessible controls surface. Where consent is required, do not load optional analytics until consent is granted; make refusal and withdrawal comparably easy. Keep essential operational telemetry distinct from optional behavioral analytics and verify the appropriate legal basis with counsel for target markets.
- Use a short retention period for raw session events; aggregate early; restrict access; document each event's purpose, fields, retention, owner, and deletion path. Use coarse buckets where exact values are not needed, and suppress small cohort reporting that could re-identify a person.
- Use only voluntary, directly stated preferences for personalization (for example, “I care most about price / speed / output quality”) and ordinary context such as selected language or display format. Avoid age/wealth inference, protected-trait proxies, individualized price discrimination, and reducing a user's included credits based on a prediction that they are unlikely to buy.
- Make segmentation serve comprehension and user benefit: e.g. show a price-conscious visitor the same plans with clear total cost, included credits, and an optional discount explanation; show a value-focused visitor quality/speed comparisons. Do not conceal plans or selectively obscure cancellation/terms.
- A product recommendation card should include the observation, evidence and denominator, confidence/limitations, user goal, proposed variant, expected benefit, and risks. Keep “apply” as a human-approved, reversible experiment with a preview, version history, and rollback.

### Gaps

- This is product-design research, not legal advice. The appropriate consent model, retention limits, children's safeguards, and pricing rules depend on the countries served, audience, data flows, and contracts.
- Evidence gathered here does not justify profiling by age, income, or willingness-to-pay, nor does it establish that demographic personalization improves conversion or user welfare.
