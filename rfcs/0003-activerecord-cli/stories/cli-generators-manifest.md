---
title: "Generators + generated models/index.ts manifest + ar init"
status: done
rfc: "0003-activerecord-cli"
cluster: cli
deps: ["cli-package-scaffold"]
deps-rfc: []
est-loc: 300
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The generated `models/index.ts` manifest is the TS substitute for Zeitwerk + the
`inherited` hook: it imports and `registerModel`s each model, keeping model files
pure (associations/scopes/validations only). Generators are **incremental, not
scanning**: `ar generate model Tweet` writes `models/tweet.ts` and **appends** the
import/register/export lines to the manifest. A full scan is needed only by
`ar init` (adopt a pre-existing `models/` dir) and an optional
`ar models:manifest --rebuild`, which reuse the relocated model-scanner.

See RFC 0003 §Proposal (§4.4, §4.7) and §5.

## Acceptance criteria

- [ ] `ar generate model <Name> [field:type …]` writes model + migration and
      appends import/register/export to `models/index.ts`
- [ ] `ar generate migration <Name>` writes a timestamped stub
- [ ] `ar init` scaffolds `config/database.ts` (TRAILS_ENV-keyed), `db/migrate/`,
      `db/seeds.ts`, `models/`, generated `models/index.ts`, and `db.ts` glue
- [ ] `ar init` full-scan adoption reuses the model-scanner (see
      [[relocate-tsc-wrapper]])
- [ ] Generated manifest carries an "AUTO-GENERATED — do not edit" header

## Notes

Open questions to settle first (RFC 0003 §7): exact generator field DSL
(`field:type`, references, indexes); whether manifest **verify** is a `trails-tsc`
built-in or a separate ESLint rule (verify is read-only — never writes; codegen
must not be a side effect of the type pass). `node:os`/config convention per §4.6.
Depends on the scanner relocation in [[relocate-tsc-wrapper]] for the scan paths.
