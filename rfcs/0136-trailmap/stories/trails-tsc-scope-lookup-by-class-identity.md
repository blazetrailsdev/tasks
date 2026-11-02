---
title: "trails-tsc: resolve schema scope ancestors by class identity, not bare name"
status: draft
updated: 2026-11-02
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

trails#9618 finds a model's schema scope from its own superclass, then walks further ancestors by bare class name (`superNames` from `collectBaseDescendants`, `byName` in `missingTables`). Two same-named intermediate classes with different parents take last-write or first-write wins, and can pick the wrong scope. `modelRegistry` and `baseClassOf` share the limit. Rails resolves this through the class object: `connection_specification_name` walks `superclass` (activerecord/lib/active_record/connection_handling.rb).

## Acceptance criteria

- Ancestors are keyed by file and class or by symbol, so same-named intermediates resolve to their own parents, with a test.
