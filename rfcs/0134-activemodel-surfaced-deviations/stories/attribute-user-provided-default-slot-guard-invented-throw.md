---
title: "activemodel: Attribute#withUserDefault guards a slot read with an invented throw"
status: ready
updated: 2026-09-01
rfc: "0134-activemodel-surfaced-deviations"
cluster: guard-parity
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/attribute.ts:241-248`:

```ts
if (!_UserProvidedDefaultCtor) {
  throw new RuntimeError(
    "UserProvidedDefault not loaded. Import '@blazetrails/activemodel' " + ...
```

CLAUDE.md's "Call-time constant resolution" section says in as many words: _a
slot read carries no guard … a `throw` explaining that the caller deep-imported
the module is invented surface._ The reader should be
`new _UserProvidedDefaultCtor!(…)`, and an unset slot surfaces as a plain
`TypeError` — the JS analogue of Ruby's `NameError` at
`with_user_default`'s constant reference.

Additionally the section enumerates exactly three sanctioned slot instances
(encryption `configurable-slot`, `collection-proxy-slot`, arel `node-slots`);
this UserProvidedDefault slot is not among them. Either register it in that
list (a CLAUDE.md edit, docs-exempt) as part of this story, or restructure so
a plain import suffices — verify the cycle actually exists with a built-`dist`
plain-node entry, per the section's own instruction.

## Acceptance criteria

- The guard and its bespoke message are gone; the read is the bare
  `new _UserProvidedDefaultCtor!(…)` shape.
- The slot is either verified cycle-necessary and added to the CLAUDE.md
  enumeration, or replaced by a plain import.
- Existing `attribute/user-provided-default.test.ts` stays green.
