# csv-reader-speed-01-run-20261121

A faster drop-in replacement for make.fun's csv-reader 1.0.0 — produces identical output, ranked on CPU time.

[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/Hachiko66/csv-reader-speed-01-run-20261121/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/Hachiko66/csv-reader-speed-01-run-20261121/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)

## Build

This entry is a single-file JavaScript module (`solve.js`) that replaces csv-reader 1.0.0's implementation while producing byte-identical output. The entrypoint is `main.ts`, which reads every case from `/input/cases.json` and writes `/output/answers.json`.

Run locally:
```
node main.ts --input /input/snapshot.json --output /output
```

## What it does

- Reads broken CSV files exactly as csv-reader 1.0.0 does (same errors, same padding, same truncation)
- Optimized parsing with array-join instead of string concatenation
- Node 22, standard library only, no network, no dependencies
- 6 practice cases verified identical to csv-reader 1.0.0 output

## License

MIT.