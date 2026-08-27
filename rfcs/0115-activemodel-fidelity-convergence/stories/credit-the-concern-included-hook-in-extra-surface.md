---
title: "credit the symbol-keyed [included]/[extended] Concern hook in parity:api:extra"
status: in-progress
updated: 2026-08-27
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 7119
claim: "2026-08-27T13:56:47Z"
assignee: "credit-the-concern-included-hook-in-extra-surface"
blocked-by: null
closed-reason: null
---

## Context

`parity:api:extra` scores the `[included]` / `[extended]` symbol hook as
**novel** surface in every activemodel file that ports an
`ActiveSupport::Concern`. Measured on the RFC 0115 tree today:

- `packages/activemodel/src/api.ts` — `[included]` (its only novel name)
- `packages/activemodel/src/conversion.ts` — `[included]` (its only novel name)
- `packages/activemodel/src/attributes.ts` — `[included]` (its only novel name)
- `packages/activemodel/src/validations.ts` — `[included]`
- `packages/activemodel/src/serializers/json.ts` — `[included]`
- `packages/activemodel/src/callbacks.ts` — `[extended]` (its only novel name)

The hook is not invented surface: it is the sanctioned trails port of Ruby's
`included do ... end` / `def self.extended(base)` block, keyed by the exported
symbols in `packages/activesupport/src/include.ts` (`included` =
`Symbol.for("@blazetrails/activesupport:included")`, `extended` likewise), and
CLAUDE.md § "Module mixins" ratifies it repo-wide. The Ruby counterpart exists
and is right there in the mapped `.rb`:

- `vendor/rails/activemodel/lib/active_model/api.rb:65-68` — `included do extend ActiveModel::Naming; extend ActiveModel::Translation end`
- `vendor/rails/activemodel/lib/active_model/conversion.rb:28-33`
- `vendor/rails/activemodel/lib/active_model/attributes.rb:34-36`
- `vendor/rails/activemodel/lib/active_model/validations.rb:40-50`
- `vendor/rails/activemodel/lib/active_model/serializers/json.rb:14-16`
- `vendor/rails/activemodel/lib/active_model/callbacks.rb:66-70` — `def self.extended(base)`

So the score is a tooling gap, not a port defect, and it is the reason
`retire-the-api-ts-re-export-wrappers` could not literally reach its stated
"api.ts at 0 novel / 0 moved" (PR #7108 landed it at 1 novel / 0 moved, the
hook being the one name). It also puts standing backwards pressure on every
remaining Concern port in this RFC: adding the hook Rails has raises the novel
count.

Note `SKIP_GROUPS` in `scripts/parity/conventions.ts` marks the _string-named_
`included` / `extended` / `inherited` methods `tsMirrorIsDrift: true` — that
entry is about a TS method literally spelled `included`, which IS drift. The
symbol-keyed hook is a different thing and is deliberately not a public
string-named member, so it never collides with that entry; the extractor
simply has no rule for it.

## Converged shape

`scripts/api-compare/extra-surface.ts` credits a computed-symbol member whose
key resolves to the activesupport `included` / `extended` symbol, when the
mapped Ruby file declares an `included do` block or a `self.extended` /
`self.included` hook on the corresponding module. The credit is per-file and
conditional on the Ruby side actually having the block — a hook on a module
whose `.rb` has none stays novel, so the rule cannot launder an invented hook.

## Acceptance criteria

- `pnpm parity:api:extra --package activemodel` reports `api.ts`, `conversion.ts`,
  `attributes.ts` and `callbacks.ts` at **0 novel / 0 moved**, and drops the
  `[included]` / `[extended]` row from `validations.ts` and `serializers/json.ts`.
- A symbol-keyed hook in a TS file whose Ruby counterpart has no `included do`
  / `self.extended` block is still scored novel (unit test).
- The `arel` extra-surface gate stays green; if the change lowers arel's or
  activerecord's numbers, tighten with `pnpm parity:api:extra:tighten` (never
  raise a mark).
- Unit tests for `extra-surface.ts` cover both arms.
