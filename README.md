# millennium-mutual-risk-intelligence
Insurance signal analysis and portfolio-based quote decision prototype.

Built for the Millennium Mutual case (Home + Auto, five Canadian cities). It follows **DATA → DETECT → DECIDE → ACT**: it reads `policies.csv` and `claims.csv`, finds patterns from every angle, checks each against articles and statistics, and turns them into decisions, automations and a price answer.

## What it found
- **Broker B07**: 60 theft claims where about 3 are normal, a median 37 days after the policy starts, 83% just under the $10,000 senior-review line. Explains the 2026 "more business, less money" deterioration.
- **Montréal Home water damage**: 3.0× Toronto's rate (95% CI 1.95–4.63), spring + October peak; Québec City (same province, same adjusters) is 5× lower. Montréal Home needs +148% on price alone to break even, or +36% (market level) together with ~60% fewer water claims.
- **Home pricing** ignores risk (Home loss ratio 1.03 vs Auto 0.53); **claims over 30 days** lose customers (55% vs 17% non-renewal); **$10,000 senior review** doubles waiting time.

## Run it
```sh
node pipeline/server.mjs          # site on http://127.0.0.1:4180
node pipeline/run.mjs [--scrape]  # detect -> (live research) -> decide, prints each command
```
Data location: `INSURANCE_DATA_DIR` (a folder with `policies.csv` and `claims.csv`), or upload both files on the site. The CSVs are not in this repo.

## Layout
- `pipeline/` — `detect.mjs` (signals, written by the team, no AI), `research.mjs` (live web scraper), `decide.mjs` (hypothesis tests, decisions, automations, pricing plan), `server.mjs`, `run.mjs`, `evidence/` (articles read and verified by research agents).
- `site/` — plain-language 3-page site (`index`, `research`, `decisions`) plus `how.html`; every claim has a "see the data" graph and "see the articles" drawer.
- `platform.html` — company underwriting console: 12 predefined profiles, price-vs-competitor slider, law-of-large-numbers simulation.
- `analysis/` — data cleaning, pricing model fit, research notes with sources. `deck/` + `presentation.html` — slide deck.

## Honest limits
Currency is unspecified; earned premium assumes 12-month policies; claim cost is an estimate (paid, denied = 0, open claims projected); there are no postal codes or property details, expense and claims-handling loads are sourced assumptions (30% and 14%), and findings are leads with stated uncertainty, not an actuarial filing.
