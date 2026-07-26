---
title: "Fold extra-surface sibling-tag section into the api:build design doc (after PR #5229 merges)"
status: draft
updated: 2026-07-26
rfc: "0080-api-compare-jsdoc-metadata"
cluster: api-compare
deps: ["no-rails-equivalent-tag-extractor-support"]
deps-rfc: []
est-loc: 80
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Fold extra-surface sibling-tag section into the api:build design doc

## Context

**Precondition: trails PR #5229 must be MERGED first.** That PR (branch
`api-build-jsdoc-design-7886e1`) creates
`docs/infrastructure/api-build-stub-generation-plan.md` defining
`@missingRailsCall`, and is owned by another live agent — do not touch the
doc or branch before merge.

After merge, add a short "sibling tag: `@noRailsEquivalent`" section to that
doc: the one-family framing from this RFC's README (shared grammar/reason
convention, `@internal` vs `@noRailsEquivalent` distinction, novel-vs-moved
scope rule, pointer back to this RFC), plus the shared machinery item the
doc already gestures at for `@missingRailsCall`: register BOTH tags as
suppressed/excluded block tags in the TypeDoc config (alongside
`excludeInternal`) and in `jsdoc/check-tag-names` if that lint is ever
enabled — one config change covering the family.

## Acceptance criteria

- `api-build-stub-generation-plan.md` documents `@noRailsEquivalent` as the
  sibling tag with the `@internal` distinction and novel-only scope rule.
- TypeDoc (and lint tag-name, if applicable) configuration lists both tags;
  neither renders on the docs site.
- No changes to `@missingRailsCall` semantics or the api:build design.
- Docs-mostly diff; well under the LOC ceiling.
