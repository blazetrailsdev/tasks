---
title: "Flag Mirrors: anchors that name no real Rails method"
status: ready
updated: 2026-07-27
rfc: "0000-fidelity-tooling-signals-and-hygiene"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

> Re-homed from RFC 0072 (api-compare parity burndown), which was pruned to
> ActiveRecord-scoped work. This story changes `scripts/api-compare/` tooling,
> not a package, so it belongs with the fidelity-verification tooling.

Found while classifying `model-schema.ts` extra surface (#5342). A `Mirrors:`
line is trails' parity anchor — it is how a reader (and `pnpm rails:find`, and
grep) confirms a TS function corresponds to a real Rails method. Three of the
lines encountered in that PR named no Rails method at all:

- `buildPkWhere` — `Mirrors: used throughout ActiveRecord persistence internals`
- `buildPkWhereNode` — `Mirrors: used with Arel managers for type-safe SQL generation`
- `hasAttributeDefinition` — `Mirrors: ActiveRecord::ModelSchema::ClassMethods#has_attribute?`,
  which does not exist; `has_attribute?` lives in attribute_methods.rb and is
  already credited to `Base.hasAttribute`.

The first two are prose that merely asserts importance; the third points at the
wrong file for a method that IS ported elsewhere. All three read as "this is a
port" while nothing verifies the claim. #5342 fixed those three by hand.

A repo-wide sweep of `packages/activerecord/src` finds **1906** `Mirrors:` lines,
of which **8** contain no Ruby identifier whatsoever (no CamelCase constant, no
backticked name, no `snake_case`, no `.rb`, no `#method`). The clearest offender
is `model-schema.ts:523` — `Mirrors: used by test infrastructure, not a direct
Rails API` — a parity anchor that explicitly states it anchors nothing. Others:
`connection-handling.ts:89`, `connection-adapters/pool-config.ts:286`,
`connection-adapters/abstract-adapter.ts:117`,
`connection-adapters/abstract-mysql-adapter.ts:2157`,
`connection-adapters/mysql2-adapter.ts:69`, `base.ts:3442`,
`connection-adapters/postgresql-adapter.ts:808`. Some of the latter are benign
(the line continues onto the next comment line, or quotes a Ruby snippet), so
the sweep needs to fold continuation lines before judging.

Note the false-anchor class is broader than the no-identifier case — a
`Mirrors:` naming a _plausible but nonexistent_ Rails method
(`ModelSchema::ClassMethods#has_attribute?`) is the more dangerous shape and is
invisible to a text-only heuristic. The `rails-api.json` manifest parity:api
already builds can resolve those: a `Mirrors:` citing
`Module::Path#method_name` is checkable against the manifest.

## Acceptance criteria

- Add a check (lint or a script alongside `scripts/api-compare/`) that flags a
  `Mirrors:` anchor which either (a) after folding comment-continuation lines
  contains no Ruby identifier, or (b) names a `Module#method` that does not
  resolve in `output/rails-api.json`.
- Report-only first, with a ratchet count, so it can land without a large
  cleanup PR attached; do NOT gate CI in the same story.
- Fix the no-identifier cases found above, or rewrite them to say plainly that
  the function is trails-only (several likely want `@internal` and no `Mirrors:`
  line at all, which is what #5342 did for `buildPkWhere`/`buildPkWhereNode`).
- Do NOT rename tests or change behavior; this is comment/anchor integrity only.
- Cross-check against `project_rails_name_is_real_path_not_divergent_alias` and
  `project_api_compare_method_must_stay_in_rails_layout_file` — a wrong-file
  `Mirrors:` is the same failure mode those record.

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
