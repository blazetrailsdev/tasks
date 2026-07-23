---
title: "reload_schema_from_cache STI redirect/local-cache apparatus has no Rails analogue"
status: draft
updated: 2026-07-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while fixing `reload-schema-recursion-misses-non-sti-under-sti`
(PR #5168). Rails' `ActiveRecord::ModelSchema#reload_schema_from_cache`
(vendor/rails/activerecord/lib/active_record/model_schema.rb:553-571) has **no**
STI branching whatsoever — it unconditionally nils its own class-level schema
ivars and then recurses into every subclass with the identical call:

```ruby
def reload_schema_from_cache(recursive = true)
  ...
  if recursive
    subclasses.each { |descendant| descendant.send(:reload_schema_from_cache) }
  end
end
```

trails' port (packages/activerecord/src/model-schema.ts, `reloadSchemaFromCache`)
carries a whole apparatus Rails does not have:

- a redirect arm that reroutes a shared-table STI subclass's reload up to
  `getStiBase(this)` instead of resetting the subclass;
- `clearStiSubclassLocalCaches(sub)`, which deletes own-property forks of
  `_columnsHash` / `_columns` / `_schemaLoaded` / `_attributesBuilder` /
  `_cachedDefaultAttributes` / `_virtualAttributesReconciled` /
  `_returningColumnsForInsertCache` and scrubs schema-sourced entries from a
  forked `_attributeDefinitions`;
- a `_schemaRevision` counter with no Rails analogue, used to invalidate STI
  subclass overlays;
- `sharesStiBaseTable()` gating added by #5168.

The root cause of the divergence is the trails-only design where STI subclasses
**share the base's `_attributeDefinitions` Map by reference** rather than each
class owning its own reflected defs as in Rails. Because the Map is mutated in
place, neither map identity nor key coverage can detect a stale subclass
overlay, which is why the revision counter and the local-cache clearing exist at
all.

Per the repo's "deviations always converge, never wontfix" rule this should be
tracked toward convergence rather than left as a permanent invention.

## Acceptance criteria

- Decide (and record) whether the shared-defs-Map STI design can converge on
  Rails' per-class ownership, or whether the apparatus is load-bearing and the
  deviation must be documented at the call site with a justification.
- If converging: `reloadSchemaFromCache` reduces to Rails' shape — reset own
  ivars, recurse `subclasses.each` — with no redirect arm, no
  `clearStiSubclassLocalCaches`, and no `_schemaRevision`.
- Existing STI reflection/reload suites stay green, including the own-table
  descendant regression tests added by #5168
  (`model-schema-reload-recursion.trails.test.ts`).
- If NOT converging, the justification lives at the call site per
  CLAUDE.md, not only in a PR body.
