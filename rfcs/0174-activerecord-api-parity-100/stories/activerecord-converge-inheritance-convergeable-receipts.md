---
title: "activerecord: the 5 CONVERGEABLE receipts in inheritance.ts"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 350
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

- `inheritance.ts:159` `@noRailsEquivalent` — CONVERGEABLE distinguishes an STI-participating class from one that merely names an inheritance_column (inheritance.rb:311); Ruby reads \_has_attribute
- `inheritance.ts:169` `@noRailsEquivalent` — CONVERGEABLE the self != base_class test Ruby writes inline (inheritance.rb:119).
- `inheritance.ts:201` `@noRailsEquivalent` — CONVERGEABLE Inheritance::ClassMethods#base_class (inheritance.rb:119) as a free function so callers without a Base-typed receiver can reach it.
- `inheritance.ts:245` `@noRailsEquivalent` — CONVERGEABLE resolves the ApplicationRecord constant Ruby names directly (core.rb:121).
- `inheritance.ts:459` `@noRailsEquivalent` — CONVERGEABLE Inheritance::ClassMethods#subclass_from_attributes (inheritance.rb:331-265) split out of new because our reflection can be cold.

Each extracts a piece of `Inheritance::ClassMethods` Rails writes inline or on `Base`.

## Acceptance criteria

- [ ] Each of the 5 declarations converges onto the Rails shape its receipt names (the helper folded back into the Rails method, the slot read through the Rails accessor, the method renamed to Rails' name), and the receipt is deleted with it.
- [ ] Where one site genuinely cannot converge in this story, it is filed as its own story in this RFC and its receipt re-tagged `CONVERGEABLE <that-story>` — never left as prose, never PERMANENT.
- [ ] `pnpm parity:api:extra:gate` stays rowless; `:calls` and `:calls:args` green.
