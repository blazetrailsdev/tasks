---
title: "One helper for the class_attribute own-write guard the deferred inherited sites share"
status: ready
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
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

## Context

Raised in review of trails#8507. Three sites test "has this class written its own
`class_attribute` value yet" by hardcoding `classAttribute`'s private storage key,
`__class_attr_<name>` (`packages/activesupport/src/class-attribute.ts`, the
`namespacedName` local):

- `packages/activemodel/src/validations.ts` — the `_validators` reader,
  `"__class_attr__validators"`, firing the deferred `inherited`
  (`vendor/rails/v8.0.2/activemodel/lib/active_model/validations.rb`, `inherited`).
- `packages/activesupport/src/callbacks.ts` — `setCallbacks`,
  `"__class_attr___callbacks"`.
- `packages/actionpack/src/action-controller/metal.ts` — the `middlewareStack`
  reader, `"__class_attr_middlewareStack"`, firing the deferred `inherited`
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal.rb:146-148`).

Each is the own-property memo guard CLAUDE.md § "`inherited` is deferred to
own-property memo guards" ratifies, but the key spelling is duplicated, so a
rename in `class-attribute.ts` silently breaks all three.

## Acceptance criteria

- One helper owned by `class-attribute.ts` answers "does this class own its
  `<name>` class attribute", receipted `@noRailsEquivalent PERMANENT` against that
  CLAUDE.md section.
- The three sites call it; no file outside `class-attribute.ts` spells
  `__class_attr_`.
