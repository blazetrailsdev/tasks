---
title: "activerecord: the CONVERGEABLE receipts in reflection.ts, nested-attributes.ts, enum.ts, store.ts"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
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

- `enum.ts:459` `@noRailsEquivalent` — CONVERGEABLE reads the EnumType off the replayed attribute set the way Ruby reads attribute_types[name] (enum.rb:222-247).
- `nested-attributes.ts:221` `@noRailsEquivalent` — CONVERGEABLE the reflection.polymorphic? guard Ruby writes inline in assign_nested_attributes (nested_attributes.rb:434).
- `reflection.ts:92` `@noRailsEquivalent` — CONVERGEABLE the options[:counter_cache] normalization Ruby does inline in counter_cache_column (reflection.rb:244).
- `reflection.ts:108` `@noRailsEquivalent` — CONVERGEABLE the belongs_to? arm of Reflection#counter_cache_column (reflection.rb:244) as a free function.
- `store.ts:38` `@noRailsEquivalent` — CONVERGEABLE Store::ClassMethods#store_accessor's accessor lookup (store.rb:112); Ruby reads the constant inline.

Each is a guard or normalization Rails writes inline in the method named in the receipt.

## Acceptance criteria

- [ ] Each of the 5 declarations converges onto the Rails shape its receipt names (the helper folded back into the Rails method, the slot read through the Rails accessor, the method renamed to Rails' name), and the receipt is deleted with it.
- [ ] Where one site genuinely cannot converge in this story, it is filed as its own story in this RFC and its receipt re-tagged `CONVERGEABLE <that-story>` — never left as prose, never PERMANENT.
- [ ] `pnpm parity:api:extra:gate` stays rowless; `:calls` and `:calls:args` green.
