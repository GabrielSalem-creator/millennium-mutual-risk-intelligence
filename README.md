# Millennium Mutual · Data → Detect → Decide → Act

The default web app analyzes the supplied Auto/Home CSVs. It removes exact duplicate claim rows for calculations, normalizes city labels, flags chronology/data-quality issues, creates evidence-linked detections, checks data sufficiency by business question, and ranks transparent next actions. Original files remain unchanged.

## Run locally

```sh
INSURANCE_DATA_DIR="/path/to/MillenniumMutual_Insurance_Data" npm start
```

Open `http://127.0.0.1:4173/insurance` for the portfolio dashboard, `/underwriting` for the applicant-level decision-support prototype, and `/presentation` for the two-part walkthrough. The folder must contain `policies.csv` and `claims.csv`. Analysis runs on the local server and returns aggregate results; it does not expose claim or customer rows in the browser. The older VDO-X behavior prototype remains at `/index.html`.

The first investigation compares Montreal and Toronto Home claim records: 115/510 versus 79/570, or 1.63× raw claim-records per policy row. This is not an exposure-adjusted rate. The interface keeps the count and distinct policies-with-claims separate, breaks the signal down by peril and loss year, shows competing explanations, and links to public evidence with its geography and limits.

The supplied files are not enough to calculate underwriting profit. They lack earned premium/exposure, ultimate claim liabilities and loss-adjustment expenses, acquisition/operating expense, reinsurance, and investment income. The app blocks a profit conclusion until those are provided. Claims-per-policy values are screening counts only, not exposure-adjusted rates. A longer research report with evidence for and against causes is in `reports/Montreal Home anomaly causes.md`.

The underwriting workbench collects property facts in the browser but does not save or transmit applicant information. It intentionally does not infer a risk class or approve/decline a person. The current files cannot train a reliable applicant rating because applicant-linked property features, earned exposure, ultimate losses, and expenses are missing. Its portfolio scenario calculates only after an insurer enters validated assumptions; the market comparison is reference-only because quote/conversion data are missing.

The code includes exact-duplicate cleanup, data-quality detectors, a Montreal–Toronto Home anomaly, an evidence ledger with competing hypotheses, a data-readiness checker, a rule-based decision queue, compound-frequency/severity formulas, and a Chebyshev sample-size function. The linked sources are a curated research starter set; dynamic web crawling and an LLM research agent are not connected in this local build. The PowerPoint is `presentations/Millennium Mutual Risk Intelligence.pptx`. This is a hackathon prototype, not a production pricing, reserving, or actuarial filing system.
