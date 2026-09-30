---
title: "activerecord: the CONVERGEABLE receipts in model-schema.ts, base.ts and attribute-methods/primary-key.ts"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
deps: ["sync-reads-of-async-reflection-retire-with-rfc-0073"]
deps-rfc: []
est-loc: 500
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

- `base.ts:794` `@noRailsEquivalent` — CONVERGEABLE the schema load Ruby performs synchronously from method_missing (active_model/attribute_methods.rb:507-486); async here, so callers must
- `model-schema.ts:71` `@noRailsEquivalent` — CONVERGEABLE the primary-key predicate Ruby builds through predicate_builder in \_update_record (persistence.rb:263).
- `model-schema.ts:94` `@noRailsEquivalent` — CONVERGEABLE the Arel form of that same predicate_builder call (persistence.rb:263).
- `model-schema.ts:138` `@noRailsEquivalent` — CONVERGEABLE turns \_query_constraints_hash into the predicate WHERE Ruby builds inline (persistence.rb:263).
- `model-schema.ts:564` `@noRailsEquivalent` — CONVERGEABLE the async half of ModelSchema#load_schema! (model_schema.rb:587), which Ruby reaches synchronously through the schema cache.
- `attribute-methods/primary-key.ts:158` `@noRailsEquivalent` — CONVERGEABLE PrimaryKey::ClassMethods#primary_key (attribute_methods/primary_key.rb:80-81) as a this-typed function; a cold-cache read does not latch
- `attribute-methods/primary-key.ts:187` `@noRailsEquivalent` — CONVERGEABLE PrimaryKey::ClassMethods#primary_key= (attribute_methods/primary_key.rb:130) as a this-typed function behind the Rails-named Base accesso
- `attribute-methods/primary-key.ts:264` `@missingRailsCall` — table_exists? — CONVERGEABLE: tableExists is async in trails, and its synchronous cache-only view (cachedTableExists) leases a connection to r
- `attribute-methods/primary-key.ts:273` `@missingRailsCall` — primary_keys — CONVERGEABLE: schemaCache.primaryKeys (primary_key.rb:104) is async in trails; getCachedPrimaryKeys is its lease-free, cache-on

These are the async-reflection seams around `load_schema!` / `primary_key` / `_update_record`'s predicate. CLAUDE.md § "Schema reflection peeks at a warm cache" ratifies the _peek_; anything else converges. `sync-reads-of-async-reflection-retire-with-rfc-0073` (RFC 0123, blocked) owns the retirement of the sync lease behind some of them.

## Acceptance criteria

- [ ] Each of the 9 declarations converges onto the Rails shape its receipt names (the helper folded back into the Rails method, the slot read through the Rails accessor, the method renamed to Rails' name), and the receipt is deleted with it.
- [ ] Where one site genuinely cannot converge in this story, it is filed as its own story in this RFC and its receipt re-tagged `CONVERGEABLE <that-story>` — never left as prose, never PERMANENT.
- [ ] `pnpm parity:api:extra:gate` stays rowless; `:calls` and `:calls:args` green.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate && pnpm parity:api:reasons && pnpm parity:api:calls:args
```
