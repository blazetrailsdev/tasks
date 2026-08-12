---
title: "extractor-predicate-and-closure-order-artifacts"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6400
claim: "2026-08-12T03:26:00Z"
assignee: "extractor-predicate-and-closure-order-artifacts"
blocked-by: null
closed-reason: null
---

## Context

Split out of `burndown-associations` (RFC 0084) after the post-0083 re-measure.
This story is the **tooling-artifact** half of that audit. RFC
0083-wide-call-ratchet-noise-reduction is closed, so it lands here rather than
being worked around in the association files.

`ts-extractor-record-this-property-access` (this RFC, PR 4656) removed the
`owner` / `reflection` / `scope` / `klass` class of false rows. The post-landing
re-measure of `associations/association.ts`,
`associations/collection-association.ts` and `autosave-association.ts` leaves 29
rows, of which the following are still extractor artifacts, not port divergence:

- **Ruby predicate → TS `is*` getter**, where the extractor emits an
  either-spelling candidate it then fails to match:
  `violates_strict_loading? | strict_loading? → isStrictLoading|strictLoading`,
  `skip_statement_cache? | any? → isAny|any`,
  `empty? | exists? → isExists|exists`,
  `concat_records | loaded? → isLoaded|loaded`,
  `changed_for_autosave? | marked_for_destruction? → isMarkedForDestruction|markedForDestruction`,
  `association_valid? | any? → isAny|any`.
- **`new → constructor`**: `collection-association.ts reset`,
  `save_collection_association` — a TS `new X()` recorded as a call to
  `constructor`.
- **Enumerable primitives with no TS method call**: `map → map` on
  `marshal_dump`, `initialize_attributes`, `save_has_one_association`,
  `save_belongs_to_association` — Ruby `Array#map` ported as a JS array
  `.map`, which the extractor does not credit uniformly.
- **`order:` rows from transitive-closure flattening**, where the Rails
  "earlier" call is nested inside the guard the TS calls first:
  `inverse_association_for | order:inverseReflectionFor,isInvertibleFor`,
  `matches_foreign_key? | order:foreignKey,isForeignKeyFor`,
  `load_target | order:mergeTargetLists,findTarget`,
  `build | order:buildRecord,addToTarget`,
  `define_autosave_validation_callbacks | order:validate,defineNonCyclicMethod`.

## Acceptance criteria

1. Each class above is either fixed in the extractor (`scripts/api-compare/extract-ts-api.ts`)
   or its non-matching is justified in one place with a citation, not
   re-derived per file.
2. The predicate class specifically: an `is*`-prefixed TS getter should credit
   the Ruby `foo?` call it mirrors — the candidate is already emitted as
   `isAny|any`, so the matcher, not the extractor, is where it is lost.
3. Re-measure the three association files afterwards; the rows that evaporate
   are deleted from `call-mismatches-exclude/` by hand (only-shrink).
4. No association source file is edited by this story.
