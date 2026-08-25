---
title: "clear-stale-no-rails-equivalent-tag-on-base-equals"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5941
claim: "2026-08-03T00:55:46Z"
assignee: "clear-stale-no-rails-equivalent-tag-on-base-equals"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while closing `extra-surface-adapter-class-names` (PR #5927).

`pnpm parity:api:extra --package activerecord` exits NON-ZERO on `origin/main` with:

```text
extra-surface: 1 STALE @noRailsEquivalent tag(s) on methods that no longer
flag as extra surface ... Delete the tag next to the code:
  - activerecord  base.ts  equals
```

This is pre-existing, NOT introduced by #5927 — verified by stashing that PR's
changes and re-running the full pipeline (`pnpm build && pnpm parity:api &&
pnpm parity:api:extra`) on a clean `origin/main` checkout, which reports the same one
entry. It means every extra-surface story currently inherits a red run it did
not cause, and has to re-derive that fact before it can trust its own totals.

Per the tool's own message, a STALE tag means one of: Rails gained the method,
the file mapping changed, the declaration is internal or `_`-prefixed (never
counted), a bare `@tag` word inside the reason prose truncated the reason and
was parsed as a real JSDoc tag, or the tag covers a moved (misplaced) port that
belongs in its Rails-layout file. `Base#equals` is most likely the first or last
of those — Ruby's `ActiveRecord::Core#==` is aliased `eql?`, and trails' `equals`
spelling may now be matching where it previously did not.

## Acceptance criteria

- Determine which of the listed causes applies to the `@noRailsEquivalent` tag
  on `equals` in `packages/activerecord/src/base.ts`, anchored to the Rails
  `file:line` for `==` / `eql?` in `activerecord/lib/active_record/core.rb`.
- If the method now has a genuine Rails counterpart, DELETE the tag (the tool's
  instruction). If instead the tag's reason prose was truncated by a bare `@tag`
  word, fix the prose so the reason parses. Do not silence the check.
- `pnpm parity:api:extra --package activerecord` exits ZERO with 0 STALE entries on
  `main`.
- `pnpm parity:api` and `pnpm parity:test` totals are non-negative.
