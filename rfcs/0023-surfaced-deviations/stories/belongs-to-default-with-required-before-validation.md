---
title: "belongs_to default: fires on before_save, breaking default+required"
status: ready
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #4266 implemented `belongsTo(name, { default })`. Rails registers the default
on `before_validation` (`activerecord/lib/active_record/associations/builder/belongs_to.rb`
`add_default_callbacks`), so a `belongs_to :x, default: ->{...}, optional: false`
saves cleanly — the default fills the FK before the presence validation runs.

trails defers the default to `before_save` (see
`packages/activerecord/src/associations/builder/belongs-to.ts` `addDefaultCallbacks`)
because the validation chain is strictly synchronous and the default block may be
async (e.g. `() => Developer.first()`). Consequence: `default` + `optional: false`
is silently broken in trails — the still-nil FK fails presence validation before
the default can fill it. Documented as a known limitation in `belongs-to.ts` and on
`AssociationOptions.default` (`associations.ts`). The wide call-mismatch
(`add_default_callbacks` omits `before_validation`) is baselined in
`scripts/api-compare/call-mismatches-wide-exclude.json`.

## Acceptance criteria

- `belongsTo(name, { default, optional: false })` saves cleanly: the default
  populates the FK before the required-association presence validation runs,
  matching Rails.
- Requires running the (possibly async) default block before validation despite
  the sync validation chain — likely an async pre-validation phase or pre-resolving
  the default. Resolve the sync-vs-async tension as part of this story.
- Remove the limitation note from `belongs-to.ts` / `AssociationOptions.default`
  and drop the `add_default_callbacks`/`before_validation` entry from
  `call-mismatches-wide-exclude.json` once the callback moves back to before_validation.
- Un-skip / add a test mirroring Rails for the `default` + required combination.
