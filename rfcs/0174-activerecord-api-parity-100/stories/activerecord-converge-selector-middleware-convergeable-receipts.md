---
title: "activerecord: the 4 CONVERGEABLE receipts in middleware/database-selector.ts and shard-selector.ts"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
deps: ["parity-100-rehome-postponed-rfc-dependencies", "converge-shard-selector-lock-fetch"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md admits two receipt shapes, `PERMANENT` and `CONVERGEABLE <story-id>`. These receipts say
`CONVERGEABLE` and then carry prose instead of a story id, so nothing tracks them
(`name-stories-for-activerecord-malformed-deviation-receipts`, RFC 0127, counts 92 such sites repo-wide;
`convergeable-tag-story-id`, RFC 0120, makes the shape an error). This story is the convergence the
prose promises, for:

- `middleware/database-selector.ts:47` `@noRailsEquivalent` — CONVERGEABLE mirrors Resolver#instrumenter (middleware/database_selector/resolver.rb:33), read from the middleware rather than the resolver.
- `middleware/shard-selector.ts:38` `@noRailsEquivalent` — CONVERGEABLE mirrors Resolver#instrumenter (middleware/database_selector/resolver.rb:33), which ShardSelector has no counterpart for.
- `middleware/shard-selector.ts:46` `@noRailsEquivalent` — CONVERGEABLE ShardSelector#resolver (middleware/shard_selector.rb:38) under a longer name; the Rails spelling is the convergence.
- `middleware/shard-selector.ts:54` `@noRailsEquivalent` — CONVERGEABLE the lock read off ShardSelector#options (middleware/shard_selector.rb:38), which Ruby indexes inline at its use site.

`vendor/rails/v8.0.2/activerecord/lib/active_record/middleware/database_selector/resolver.rb:33` and middleware/shard_selector.rb:38; one is simply `ShardSelector#resolver` under a longer name. `converge-shard-selector-lock-fetch` (RFC 0082) fixes the `fetch` semantics in the same file.

## Acceptance criteria

- [ ] Each of the 4 declarations converges onto the Rails shape its receipt names (the helper folded back into the Rails method, the slot read through the Rails accessor, the method renamed to Rails' name), and the receipt is deleted with it.
- [ ] Where one site genuinely cannot converge in this story, it is filed as its own story in this RFC and its receipt re-tagged `CONVERGEABLE <that-story>` — never left as prose, never PERMANENT.
- [ ] `pnpm parity:api:extra:gate` stays rowless; `:calls` and `:calls:args` green.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate && pnpm parity:api:reasons && pnpm parity:api:calls:args
```
