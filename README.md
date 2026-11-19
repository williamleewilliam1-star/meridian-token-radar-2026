# MERIDIAN — Pre-token intelligence

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/williamleewilliam1-star/meridian-token-radar-2026/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/williamleewilliam1-star/meridian-token-radar-2026/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

MERIDIAN is a standalone research dashboard for the [make.fun token-radar-01 competition](https://make.fun/bounty/token-radar-01). It ranks 194 protocols whose supplied snapshot records no token metadata and covers all 40 required watchlist entries. Each detail drawer pairs a conditional five-step participation plan with a transparent valuation scenario. The dashboard runs entirely from local files; it makes no network requests or wallet transactions.

## Run locally

Requires Node.js 22.18 or newer and the official kit at `../token-radar-01-kit`. From the repository root:

```sh
RADAR_INPUT=../token-radar-01-kit/input RADAR_OUTPUT=out node --experimental-strip-types main.ts
```

Open `out/dashboard/index.html` in a browser that permits local file access. The page reads the generated `out/data.js`; no server or API is required. The competition runner can instead mount the snapshot at `/input/snapshot.json` and use the default `/output` directory. The build writes `board.json`, `data.js`, the dashboard, screenshots, and the canonical `dossier.json`.

Use search, chain/category/confidence filters, and sorting on the radar board. Select a row to see its participation plan. The Valuation model tab exposes the calculation; the hash supports `#protocol=steakhouse-financial&tab=plan` and `tab=model`. Switch tabs with click, Enter/Space, or arrow keys; Escape closes the drawer.

## Methodology

Token-bearing protocols with reported market cap form the comparable cohort. For each peer, the model calculates market cap / TVL, trims the top and bottom deciles, takes category medians, then shrinks each category estimate toward the global median using eight pseudo-peers. Candidate TVL is multiplied by that ratio and bounded adjustments for seven-day momentum, listing age, chain breadth, and model confidence. Low and high scenarios widen when comparable support or metadata is thin. The board excludes recorded token metadata and screened derivative categories while retaining all 40 watchlist slugs.

The five participation steps describe research, verification, possible activity, monitoring, and exit. They include approximate time and conditional fees. They are prompts for independent diligence, not claims that incentives exist.

## Limitations

The input is a sealed snapshot, so token status, contracts, fees, access, and reward terms may have changed. Missing token metadata does not prove that no token exists. TVL is assets locked, not revenue; market cap / TVL is a heuristic. The implied value is a market capitalization scenario, not a token price, launch forecast, or investment recommendation. No token or airdrop is guaranteed. Verify official sources and risks before any wallet activity.

## Tests and screenshots

```sh
node --check dashboard/app.js
node --experimental-strip-types --test tests/*.test.ts
RADAR_INPUT=../token-radar-01-kit/input RADAR_OUTPUT=out node --experimental-strip-types main.ts
```

The tests check eligibility, ordering, valuation bounds, five-step semantics, and complete watchlist coverage. To refresh the actual 1400×900 Chrome captures on macOS, run `scripts/screenshots.sh` in a local terminal with Chrome installed. It captures [board](screenshots/1-board.png), [detail plan](screenshots/2-detail.png), and [filtered board](screenshots/3-filtered.png), checks the 512 KiB image cap, and rebuilds the dossier. The source dashboard is plain HTML, CSS, and JavaScript. `vendor/makefun-board.ts` is the unchanged official dossier library.

---

Built for [make.fun](https://make.fun/?ref=gntv6vzw&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01).
