---
title: "Remove the internal-write bridge; converge _write_attribute to raise"
status: ready
updated: 2026-07-08
rfc: "0046-strict-write-attribute-internal-convergence"
cluster: null
deps:
  [
    "declare-pg-adapter-suite-model-columns",
    "declare-mysql-adapter-suite-model-columns",
    "audit-sqlite-suite-internal-write-bridge-reliance",
  ]
deps-rfc: []
est-loc: 40
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Final convergence: remove the internal-write bridge added in PR #4027 so the
low-level `_write_attribute` reaches `write_from_user` and raises
`MissingAttributeError` for an unknown name, exactly like Rails `write.rb:42`.

The bridge lives in `packages/activerecord/src/readonly-attributes.ts`
`_writeAttribute`:

```ts
try {
  Model.prototype._writeAttribute.call(this, name, value);
} catch (error) {
  if (!(error instanceof MissingAttributeError)) throw error;
  this._attributes.writeCastValue(name, value); // BRIDGE
}
```

## Acceptance criteria

- [ ] Remove the `catch → writeCastValue` fallback; `_writeAttribute` delegates
      straight to `Model.prototype._writeAttribute` (raises on unknown name),
      matching Rails `write.rb:42`.
- [ ] All three AR CI jobs (sqlite / postgres / mysql:8) green — i.e. every
      bespoke model that previously leaned on the bridge now declares its real
      columns (or the tables are warmed).
- [ ] No regression to construction, mass assignment, counter-cache,
      composite/custom PK assignment, timestamps, or locking.
- [ ] Depends on the declare-\* (and/or warm) stories + the audit.
