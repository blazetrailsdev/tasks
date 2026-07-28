---
title: "extra-surface-skip-duck-typed-interface-members"
status: in-progress
updated: 2026-07-28
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5467
claim: "2026-07-28T00:04:17Z"
assignee: "extra-surface-skip-duck-typed-interface-members"
blocked-by: null
closed-reason: null
---

## Context

Found by the `@noRailsEquivalent` tag audit (RFC 0080). `globalid/locator.ts`
tags two members, `find` (:19) and `where` (:25), which are not locator
methods at all — they are members of the duck-typed `LocatorModel` interface
that declares the Active Record surface Rails' `BaseLocator` calls as
`model_class.find gid.model_id` and
`model_class.where(primary_key => ids)` on the `ignore_missing` path.

Ruby needs no such declaration, so the tag reason is factually right, but the
disposition is wrong: this is a comparator gap, not permanent trails-only
surface. A TypeScript interface that exists solely to type a duck-typed
collaborator has no Ruby counterpart by construction, and every such interface
in the repo would need the same tag. The comparator should not count its
members as extra surface in the first place.

## Acceptance criteria

- Decide the rule: either the extractor skips members of interfaces that no
  Ruby entity maps onto, or such interfaces are marked once at the
  declaration (the tag already reads on class / interface / namespace
  declarations since PR 5462) instead of member-by-member.
- Implement the chosen rule in `scripts/api-compare/`, with the reasoning
  recorded in the script the way other allow-set rules are.
- Delete the per-member `find` / `where` tags in `globalid/locator.ts`.
- Sweep for other duck-type interfaces that the rule newly covers and remove
  their tags too.
- `pnpm api:extra` reports no stale tags.
