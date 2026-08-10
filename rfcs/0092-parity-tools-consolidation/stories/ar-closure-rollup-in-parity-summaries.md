---
title: "Derive the AR/AM require closure and report an 'AR closure' parity rollup"
status: done
updated: 2026-08-10
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6347
claim: "2026-08-10T19:18:57Z"
assignee: "ar-closure-rollup-in-parity-summaries"
blocked-by: null
closed-reason: null
---

## Context

Audit `activesupport-ar-gaps-20260810T143915Z.md`: the project's scope for activesupport is the AR/AM require closure (101 AS files), but the parity summaries only roll up whole packages, so the headline (46.9%) mixes in 699 out-of-scope members. `scripts/api-compare/compare.ts:3326` already computes a hand-listed "Data layer" rollup (`arel + activemodel + activerecord`).

Add an "AR closure" rollup line that includes the data-layer packages **plus the activesupport (and date/i18n/globalid/did-you-mean) files inside the AR/AM require closure**. Derive the closure programmatically rather than hard-coding the file list: a small script that walks `require "active_support/…"` lines from `vendor/rails/{activerecord,activemodel}/lib` and expands the umbrella files (`active_support.rb`, `rails.rb`, `core_ext/{array,module,numeric,range,digest}.rb`, `time.rb`, `json.rb`, `core_ext/{time,date,date_time}.rb`) into a generated file-set artifact the rollup reads. `scripts/api-compare/lint-deps.ts` (parity:api:deps) already parses vendored Ruby requires — reuse its extraction rather than writing a second parser.

Note: story `0072-api-compare-parity-burndown/activesupport-out-of-closure-unported-entries` (filed same audit) shrinks the AS denominator via UNPORTED_FILES; this rollup stays useful regardless — it reports the closure subset explicitly instead of implying it through exclusions, and keeps working if out-of-closure files are ported later for actionpack.

## Acceptance criteria

- `pnpm parity:api` prints an "AR closure" rollup (matched/total/%) alongside the Data layer line, derived from the generated closure artifact, not a hand list.
- The closure artifact regenerates from vendor/rails so a moved `require` updates the scope without a code change.
- Whole-package summaries are unchanged; no denominators move.
