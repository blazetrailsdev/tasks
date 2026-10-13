---
title: "serializable_attributes filters out names an included module's method shares, where Rails' generated reader shadows the method"
status: draft
updated: 2026-10-13
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `serializable_attributes` is `attribute_names.index_with { |n| read_attribute_for_serialization(n) }` (`vendor/rails/v8.0.2/activemodel/lib/active_model/serialization.rb:166-168`), with no filtering.

trails#8862 made `readAttributeForSerialization` `rbFSend(this, key)` and, by owner ruling (2026-10-08, story `read-attribute-for-serialization-is-send`), added a filter to `serializableAttributes` (`packages/activemodel/src/serialization.ts`): a name that resolves to a method owned by an included module (`rbModInstanceMethod(this.constructor, n).owner` not in the record's prototype chain) is left out of the hash. Without it an attribute named `toJSON` recurses forever, because reader generation skips a name a class body already answers (`isDefinedByAClassBody`, `packages/activemodel/src/attribute-methods.ts`; CLAUDE.md § "Generated attribute readers are properties").

In Rails the generated reader lives in the generated-attribute-methods module and shadows a method from a module included earlier, so `send` returns the attribute and the name IS serialized. Two things keep trails from that:

- `include()` copies a module's methods onto the including class's prototype, below the generated module's carrier, so Ruby's ancestor order between the two is lost. An ancestor-order rule over `rbModAncestors` was tried in trails#8862 and `toJSON` recursed again.
- The arm carries no receipt. `parity:api:arms:throws` rejects an `@inventedArm` tag on `serializableAttributes` ("declaration not compared") and `blazetrails/no-freeform-comments` rejects a citation line. The only record is two tests in `serialization.trails.test.ts` ("attribute named toJSON does not shadow Model#toJSON", "serializable_hash leaves out a stored value an included module's method shares its name with").

## Acceptance criteria

- [ ] Either the attribute value is serialized for a name an included module's method shares (the Rails result, e.g. by reading through the reader half reader generation would have produced), and the filter in `serializableAttributes` is deleted so the body is the `index_with` alone; or the arm is receipted at its declaration by a tag the arms gate accepts on a declaration it does not compare.
- [ ] The two trails tests above are updated to the converged result.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:arms:throws` and `pnpm parity:api:extra:gate` are green with no baseline row added.
