---
title: "parity:api:extra scores a synthesized container as novel when the Ruby module name differs from its filename"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 6103
claim: "2026-08-04T23:23:03Z"
assignee: "credit-mixin-methods-ported-in-their-own-file"
blocked-by: null
closed-reason: null
---

## Context

`extract-ts-api.ts` synthesizes a file-level container for a TS file that
declares only top-level functions, and names it from the FILENAME. For
`packages/activesupport/src/core-ext/range/compare-range.ts` (ported in #6096)
that container is `CompareRange`, but the Ruby module is
`ActiveSupport::CompareWithRange`
(`vendor/rails/activesupport/lib/active_support/core_ext/range/compare_range.rb:2`)
— the file is `compare_range.rb` while the module inside it is
`CompareWithRange`.

Result: `pnpm parity:api:extra --package activesupport` scores `compare-range.ts` as
`1 novel` for a name nobody wrote, purely because Rails' filename and module
name differ. The methods themselves match (`isInclude` via `rubyMethodToTs`,
`caseEquals` via the `"===" -> ["caseEquals"]` entry #6096 added to
`MIRROR_CANDIDATE_OVERRIDES`).

## Converged shape

The synthesized container name should come from the matched `.rb`'s declared
module/class names, not the filename — the extract already has them
(`rails-api.json` carries the fqn for the file). Where the file declares exactly
one module, use it; where it declares several, allow all of them (the allowed
set is already unioned per-file). Failing that, add the filename-derived name to
the per-file allowed set whenever the matched `.rb` declares any module at all,
so a filename/module skew can never score as novel surface.

Sweep for other instances: any Rails file whose module name is not the
camelization of its basename hits the same bug.

## Acceptance criteria

- `core-ext/range/compare-range.ts` reports 0 novel.
- `scripts/api-compare/extra-surface.test.ts` covers the filename/module skew.
- Total novel count across packages does not increase (the fix only removes
  false positives).
