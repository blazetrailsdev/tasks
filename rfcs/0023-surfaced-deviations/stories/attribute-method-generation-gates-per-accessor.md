---
title: "Setter-only override suppresses generated attribute reader (gate get/set independently)"
status: done
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 3619
claim: "2026-06-19T01:42:16Z"
assignee: "attribute-method-generation-gates-per-accessor"
blocked-by: null
---

## Context

Surfaced during the Bulb inverse shares-objects port (PR #3486). In Rails a
model may override only the writer (`def color=`) and still get the generated
attribute _reader_ (`activerecord/test/models/bulb.rb:27-29`). In trails,
defining a class-level `set color(...)` on the prototype makes `'color' in
prototype` true, so `generateConcreteAttributeMethods` skips generating the
`color` getter and `record.color` reads `undefined` (a write-only accessor).

We worked around this in the `Bulb` fixture by adding an explicit
`get color() { return this.readAttribute("color"); }`, but the framework
behavior diverges from Rails: a setter-only override should not suppress the
generated reader (and vice-versa).

Relevant code: `packages/activerecord/src/attribute-methods.ts`
(`generateConcreteAttributeMethods` / the dangerous-method &
already-implemented checks that gate getter/setter generation per-accessor).

## Acceptance criteria

- [ ] A model that defines only a setter for an attribute (e.g. `set color`)
      still gets the generated reader; `record.color` returns the stored value.
- [ ] Symmetric: defining only a getter does not suppress the generated setter.
- [ ] Generation gates each accessor (get vs set) independently rather than on
      mere presence of the property name on the prototype.
- [ ] Remove the explicit `get color()` workaround from
      `test-helpers/models/bulb.ts` once the framework generates the reader.
