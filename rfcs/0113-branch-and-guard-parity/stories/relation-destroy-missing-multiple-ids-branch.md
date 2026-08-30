---
title: "Relation#destroy is missing the multiple-ids / composite-PK branch"
status: in-progress
updated: 2026-08-30
rfc: "0113-branch-and-guard-parity"
cluster: missing-arm
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 7269
claim: "2026-08-30T20:54:11Z"
assignee: "converge-respond-to-missing-base-arm-and-aggregation-validity"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the RFC 0072 model-accessor sweep (PR #5322).

Rails `vendor/rails/activerecord/lib/active_record/relation.rb:1083-1092`:

```ruby
def destroy(id)
  multiple_ids = if model.composite_primary_key?
    id.first.is_a?(Array)
  else
    id.is_a?(Array)
  end

  if multiple_ids
    find(id).each(&:destroy)
  else
    find(id).destroy
  end
end
```

trails `packages/activerecord/src/relation.ts` `destroy` has no multiple-id
branch at all — it does `find(id)` then `record.destroy()`, so
`Todo.destroy([1, 2, 3])` destroys whatever single object `find` returns rather
than each record. The composite-primary-key discrimination (`id.first.is_a?(Array)`
vs `id.is_a?(Array)`) is also absent, which matters because a CPK id is itself
an array and must not be mistaken for a list of ids.

Baseline entry carrying this finding:
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation.json`,
`rubyName: destroy`, `call: model`.

## Acceptance criteria

- `destroy` branches on `model.compositePrimaryKey` exactly as relation.rb:1084
  does, and destroys each record for the multiple-id case.
- Covers both the single-PK array form and the composite-PK form.
- Tests mirror the Rails cases verbatim (check
  `vendor/rails/activerecord/test/cases/` first).
- The `destroy` / `model` wide-baseline entry is removed.

## Triage note (2026-08-18): the baseline path in this body is stale

This story cites `scripts/api-compare/call-mismatches-wide-exclude/…`. **That
tree no longer exists.** RFC 0084 folded the narrow RFC 0044 ratchet and the
wide one into a single gate over a single baseline:
`scripts/api-compare/call-mismatches-exclude/<package>/<tsFile .ts→.json>`,
gated by `pnpm parity:api:calls` (call-set rows) and `pnpm parity:api:calls:args`
(`kind: "args"` rows, RFC 0095).

Look for the row there, under the same `rubyName` / `call` pair. Everything else
in this story — the Rails and trails `file:line` citations, the described
divergence — is unaffected; only the path to the baseline row changed.

Remember the baseline is only-shrink: on converging, delete the one row by hand
(via `serializeBaseline`, sorted — never `--write`/reseed), then
`pnpm parity:api:calls:tighten <package>/<file>.json` for the stale high-water mark.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0113-branch-and-guard-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
