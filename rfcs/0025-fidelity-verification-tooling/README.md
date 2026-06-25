---
rfc: "0025-fidelity-verification-tooling"
title: "Fidelity verification tooling — options-key/constants/deprecation parity, error-class + raw-SQL lint rules"
status: active
created: 2026-06-12
updated: 2026-06-12
owner: "@deanmarano"
packages:
  - activerecord
  - arel
clusters:
  - api-compare
  - lint
---

# RFC 0025 — Fidelity verification tooling

## Summary

The port's existing verification toolchain covers API **surface**
(`api:compare`, 4951/4952 at 100%), naming/structure (generated ESLint
baselines), behavior (`test:compare`, 92.4%), and output (`parity:schema` /
`parity:query`). What it does NOT measure: **option-hash keys** (the biggest
remaining Ruby-API dimension), **error-class identity**, **literal
constants/defaults**, **deprecation status**, and the arel-only SQL rule that
exists only as CONTRIBUTING prose. This RFC adds five bounded tools, each
following an existing, proven pattern in the trails repo (generated-manifest
ESLint rule, api:compare sub-report) so every story is mechanical to
implement and ratchets via a baseline that only shrinks.

Source analysis: `trails/docs/activerecord/port-fidelity-analysis-2026-06-11.md`.

## Motivation

Concrete divergences the current toolchain cannot see:

- A `hasMany` options type missing a key Rails accepts (`inverse_of`-class
  gaps) passes api:compare (name + arity match) and stays invisible until a
  ported test happens to exercise it.
- Users `rescue ActiveRecord::RecordNotFound`; nothing verifies our
  `errors.ts` hierarchy matches Rails' error classes or that Rails-mirroring
  code throws ported error classes instead of bare `Error`.
- CONTRIBUTING bans raw SQL strings outside adapters; RFC 0022 exists because
  string-assembled SQL crept in anyway — the ban is unenforced prose.
- Literal defaults (batch sizes, lock names) and `@deprecated` status can
  silently differ — `extract-ruby-api.rb` already parses signatures, so
  defaults are in reach.

All five tools are **report-first or baseline-ratcheted**: none can break CI
on day one; each starts with a generated exclude baseline (the
`require-canonical-schema` shape) or a JSON report, and tightens from there.

## Design

Two clusters. Every story names the exact pattern file to copy.

### Cluster `api-compare` — extend the extraction/compare pipeline

The pipeline: `scripts/api-compare/extract-ruby-api.rb` (Ripper-based, emits
`output/rails-api.json`) + `extract-ts-api.ts` (TS compiler API, emits
`output/ts-api.json`) + `compare.ts` / `arity.ts` (matching + sub-reports).
The **arity checker** (`arity.ts` → `output/arity-mismatches.json`, surfaced
in the `run.sh` summary line) is the pattern to clone: a post-match
sub-report over already-matched method pairs, advisory output file, count in
the summary.

- **Options-key parity** (`options-kwargs-key-parity`): harvest accepted
  option keys per Ruby method (explicit `valid_options` arrays where they
  exist; `options[:foo]` / `options.fetch(:foo)` / `options.key?(:foo)`
  accesses in the method body via Ripper); harvest the corresponding TS
  options-interface keys from the parameter type AST; diff per matched pair.
- **Constants/defaults parity** (`constants-defaults-parity`): the Ruby
  extractor already captures parameter signatures (see `rubySig` in
  arity-mismatches.json); extend both extractors to record **literal**
  default values (number/string/symbol/true/false/nil) and module-level
  constants, compare literals after symbol→string normalization.

### Cluster `lint` — generated-manifest ESLint rules

The pattern: `eslint/rails-private-jsdoc.mjs` + its generated
`eslint/rails-private-methods.json` manifest (written by api:compare), with a
colocated `*.test.mjs`, registered in `eslint.config.mjs` under the
`blazetrails` plugin (see L106–130) and scoped per file-glob. Ratchet
baselines follow `eslint/require-canonical-schema-exclude.json`.

- **Error-class parity** (`error-class-parity-lint`): manifest of Rails error
  classes harvested from the vendored source (pattern:
  `scripts/build-rails-privates-manifest.ts`); rule (a) asserts every
  manifest class has a TS counterpart with matching parent, (b) bans
  `throw new Error(` in Rails-mirroring `src/` files.
- **No raw SQL** (`no-raw-sql-lint`): flag SQL-keyword string/template
  literals passed to execution methods outside `connection-adapters/` and
  `tasks/`, with a generated exclude baseline for legitimate admin-SQL sites.
- **Deprecation parity** (`deprecation-parity-lint`): manifest of
  `deprecator`-wrapped Rails methods; rule requires `@deprecated` JSDoc on
  the TS counterpart (autofixable, like rails-private-jsdoc).

## Alternatives considered

- **One mega "fidelity audit" agent pass instead of tooling.** Rejected:
  audits decay; generated baselines + CI ratchets keep measuring after every
  merge.
- **Gating (CI-fail) from day one.** Rejected: every tool starts advisory or
  baseline-excluded; flipping to error is a one-line config change once the
  baseline is reviewed.
- **prism for Ruby body parsing.** Rejected: `extract-ruby-api.rb` already
  uses Ripper and runs everywhere CI does; new extraction stays in the same
  script.
- **Body-shape fingerprinting, behavioral-stub lint, schema canonical v2
  (FKs/check constraints), differential query fuzzing** (all from the source
  analysis doc). Deferred — descoped from this RFC to keep it to the
  highest-signal five tools; each can become its own RFC/story later.

## Rollout

1. Phase 1 (independent, parallel-safe — distinct file sets):
   `no-raw-sql-lint`, `error-class-parity-lint`,
   `options-kwargs-key-parity`.
2. Phase 2 (build on Phase-1 extraction plumbing):
   `constants-defaults-parity`, `deprecation-parity-lint`.

## Open questions

1. **Where does the options-key TS truth live for option bags typed as
   broader interfaces (e.g. shared `QueryOptions`)?** Recommendation: compare
   against the _resolved_ property set of the parameter type via the type
   checker, and skip-with-reason any method whose options param isn't an
   object type.

## Changelog

- 2026-06-12: initial RFC
- 2026-06-12: descope to five stories — body-shape-fingerprinting,
  behavioral-stub-lint, schema-canonical-v2-fk-check moved to
  Alternatives/deferred
