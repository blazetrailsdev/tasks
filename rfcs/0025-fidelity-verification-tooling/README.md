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

## Stories

<!-- generated: stories table -->

| ID                                                                                                                          | Title                                                                                                                                                                                                     | Status      | Est LOC | Cluster     |
| --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------- | ----------- |
| [extractor-scan-umbrella-module-config-to-base](stories/extractor-scan-umbrella-module-config-to-base.md)                   | Scan top-level umbrella module config into ActiveRecord::Base, drop curated allowlist                                                                                                                     | ready       | 250     | —           |
| [rails-callback-invocation-lint-rule](stories/rails-callback-invocation-lint-rule.md)                                       | Lint rule: ported AR methods must invoke run_callbacks events Rails declares                                                                                                                              | ready       | 150     | lint        |
| [rails-error-parity-bare-throw-burndown-continue-3](stories/rails-error-parity-bare-throw-burndown-continue-3.md)           | rails-error-parity bare-throw burndown (continue 3): remaining activemodel non-validator files                                                                                                            | ready       | 200     | —           |
| [resolve-alias-arity-through-includes](stories/resolve-alias-arity-through-includes.md)                                     | api-compare: resolve alias arity through included-module/inherited targets                                                                                                                                | ready       | 120     | —           |
| [drift-report-gem-level-package-add-remove](stories/drift-report-gem-level-package-add-remove.md)                           | api:drift — surface gem-level package add/remove from upstream Gemfile                                                                                                                                    | claimed     | 200     | —           |
| [drift-report-base-manifest-extractor-skew-guard](stories/drift-report-base-manifest-extractor-skew-guard.md)               | api:drift — guard base/target extractor-version skew                                                                                                                                                      | in-progress | 150     | —           |
| [api-compare-cache-key-extractor-schema-version](stories/api-compare-cache-key-extractor-schema-version.md)                 | api-compare: key ts-api cache on extractor output-schema version so new fields (e.g. calls) bust stale entries                                                                                            | done        | 120     | —           |
| [api-compare-resolve-alias-arity](stories/api-compare-resolve-alias-arity.md)                                               | api-compare: resolve Ruby alias arity to target so faithful TS delegators don't false-flag                                                                                                                | done        | 150     | —           |
| [api-compare-shared-cache-eviction](stories/api-compare-shared-cache-eviction.md)                                           | Prune the api:compare shared cross-worktree cache (stale keys + superseded CACHE_VERSION dirs)                                                                                                            | done        | 120     | —           |
| [api-compare-shared-worktree-cache](stories/api-compare-shared-worktree-cache.md)                                           | api:compare cross-worktree shared cache (rails-api.json + ts per-package), version-keyed                                                                                                                  | done        | 300     | —           |
| [constants-defaults-parity](stories/constants-defaults-parity.md)                                                           | api:compare: literal parameter-default + constant parity report                                                                                                                                           | done        | 250     | api-compare |
| [converge-relation-wherevalues-to-whereclause](stories/converge-relation-wherevalues-to-whereclause.md)                     | converge-relation-wherevalues-to-whereclause                                                                                                                                                              | done        | null    | —           |
| [cross-version-api-drift-report](stories/cross-version-api-drift-report.md)                                                 | Cross-version Rails API drift report (upgrade worklist), scoped to ported surface                                                                                                                         | done        | 250     | —           |
| [deprecation-parity-lint](stories/deprecation-parity-lint.md)                                                               | ESLint: require @deprecated JSDoc where Rails deprecates (deprecation parity)                                                                                                                             | done        | 250     | lint        |
| [error-class-parity-lint](stories/error-class-parity-lint.md)                                                               | ESLint: Rails error-class manifest parity + ban bare throw new Error in Rails-mirroring source                                                                                                            | done        | 300     | lint        |
| [extra-surface-walkmixin-unported-guard](stories/extra-surface-walkmixin-unported-guard.md)                                 | api-compare: apply isSourceUnported guard to extra-surface walkMixin (parity with compare.ts)                                                                                                             | done        | 40      | —           |
| [extractor-capture-enumerable-metaprogrammed-surface](stories/extractor-capture-enumerable-metaprogrammed-surface.md)       | extractor-capture-enumerable-metaprogrammed-surface                                                                                                                                                       | done        | null    | —           |
| [extractor-capture-globalid-mixin-surface](stories/extractor-capture-globalid-mixin-surface.md)                             | api-compare: resolve cross-package GlobalID mixin into AR Base allowed-set                                                                                                                                | done        | 150     | —           |
| [extractor-capture-metaprogrammed-ruby-surface](stories/extractor-capture-metaprogrammed-ruby-surface.md)                   | api-compare extractor: capture class_attribute/alias/delegate-generated Ruby methods                                                                                                                      | done        | 200     | —           |
| [extractor-capture-singleton-class-attr-accessor-config](stories/extractor-capture-singleton-class-attr-accessor-config.md) | api-compare: capture singleton_class.attr_accessor module config as Base statics                                                                                                                          | done        | 200     | —           |
| [extractor-capture-super-calls](stories/extractor-capture-super-calls.md)                                                   | Capture super calls in both extractors for call-set parity                                                                                                                                                | done        | 120     | —           |
| [gate-extractor-capture-capability-wrappers](stories/gate-extractor-capture-capability-wrappers.md)                         | test-compare gate extractor: capture respond_to?/supports_X? module wrappers                                                                                                                              | done        | 150     | —           |
| [literal-parity-negative-numbers](stories/literal-parity-negative-numbers.md)                                               | literals.ts: restore negative-number literal default/constant comparison                                                                                                                                  | done        | 40      | —           |
| [no-raw-sql-lint](stories/no-raw-sql-lint.md)                                                                               | ESLint: ban raw SQL strings outside connection-adapters/tasks (enforce the arel-only rule)                                                                                                                | done        | 250     | lint        |
| [no-raw-sql-scope-out-ddl-infra](stories/no-raw-sql-scope-out-ddl-infra.md)                                                 | no-raw-sql: scope out test-helpers/test-setup DDL infra instead of baseline-grandfathering                                                                                                                | done        | 80      | —           |
| [no-raw-sql-scope-sink-sql-arg](stories/no-raw-sql-scope-sink-sql-arg.md)                                                   | no-raw-sql: only flag the SQL argument of sink calls, not op-name labels                                                                                                                                  | done        | 80      | —           |
| [options-key-residual-false-positive-filters](stories/options-key-residual-false-positive-filters.md)                       | Reduce remaining options-key false positives: recognize positional-arg-as-option (new_column_definition :type) and scope the TS candidate pool to curb cross-adapter artifacts (create_database :charset) | done        | 150     | —           |
| [options-kwargs-key-parity](stories/options-kwargs-key-parity.md)                                                           | api:compare: per-method Ruby option-key vs TS options-interface diff                                                                                                                                      | done        | 400     | api-compare |
| [rails-error-parity-bare-throw-burndown](stories/rails-error-parity-bare-throw-burndown.md)                                 | Burn down rails-error-parity bare-throw baseline: replace throw new Error with ported Rails error classes (491 sites / 142 files)                                                                         | done        | 300     | —           |
| [rails-error-parity-bare-throw-burndown-continue](stories/rails-error-parity-bare-throw-burndown-continue.md)               | Continue rails-error-parity bare-throw burndown (ar/am remaining ~126 files); port missing Ruby bases (RuntimeError, FrozenError) needed by guard sites                                                   | done        | 300     | —           |
| [rails-error-parity-bare-throw-burndown-continue-2](stories/rails-error-parity-bare-throw-burndown-continue-2.md)           | rails-error-parity-bare-throw-burndown-continue-2                                                                                                                                                         | done        | null    | —           |
| [rails-error-parity-check-scattered-error-files](stories/rails-error-parity-check-scattered-error-files.md)                 | rails-error-parity: check scattered (non-errors.ts) error-class files                                                                                                                                     | done        | 150     | —           |
| [rails-error-parity-flag-unported-error-files](stories/rails-error-parity-flag-unported-error-files.md)                     | rails-error-parity: flag manifest error classes whose home file is entirely unported                                                                                                                      | done        | 150     | —           |
| [rails-error-parity-widen-activesupport](stories/rails-error-parity-widen-activesupport.md)                                 | Widen rails-error-parity rule scope to activesupport (manifest already includes it; add eslint.config scope + baseline)                                                                                   | done        | 120     | —           |

## Changelog

- 2026-06-12: initial RFC
- 2026-06-12: descope to five stories — body-shape-fingerprinting,
  behavioral-stub-lint, schema-canonical-v2-fk-check moved to
  Alternatives/deferred
