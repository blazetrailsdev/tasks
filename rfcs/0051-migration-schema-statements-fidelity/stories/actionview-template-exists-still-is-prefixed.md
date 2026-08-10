---
title: "actionview-template-exists-still-is-prefixed"
status: done
updated: 2026-07-31
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5758
claim: "2026-07-31T21:20:42Z"
assignee: "actionview-template-exists-still-is-prefixed"
blocked-by: null
closed-reason: null
---

## Context

After PR #5752, `isTemplateExists`
(`packages/actionview/src/view-paths.ts:123`) is the last `*_exists?` predicate in
the repo still carrying the `is` prefix. It ports ActionView's
`template_exists?`.

The sweep that removed the others (#5736, then #5752 for `database_exists?` and
`index_name_exists?`) stopped at the ActiveRecord boundary.

The hazard the sweep exists to remove is documented: an `is`-prefixed base
predicate plus a bare-named subclass method are different symbols, so the
subclass never overrides, TS reports nothing, and parity:api accepts both
spellings. That is exactly the dead override #5752 found in
`PostgreSQLSchemaStatements#indexNameExists`.

## Acceptance criteria

- `isTemplateExists` is renamed `templateExists`, with call sites updated.
- Before renaming, check for a bare `templateExists` elsewhere in actionview — if
  one exists, it is currently a dead override and its behaviour must be diffed
  against the base before it goes live.
- parity:api surface unchanged or improved.
