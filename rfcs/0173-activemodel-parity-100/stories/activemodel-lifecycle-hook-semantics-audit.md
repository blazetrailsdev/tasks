---
title: "activemodel: every included / extended / inherited hook's behaviour is carried (7 skipped hooks)"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: skips
packages: ["activemodel"]
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

`SKIP_GROUPS[4]` (lifecycle hooks, `tsMirrorIsDrift`) removes seven activemodel hook definitions from
scoring. CLAUDE.md § "Module mixins" ratifies the _spelling_ — `included`/`extended` are the
symbol-keyed callbacks `include()`/`extend()` fire, and a string-named method is drift — but nothing
checks that each hook's _body_ is carried:

- `Validations::Acceptance` `included` — `vendor/rails/v8.0.2/activemodel/lib/active_model/validations/acceptance.rb`
- `Type::SerializeCastValue` `included` — `vendor/rails/v8.0.2/activemodel/lib/active_model/type/serialize_cast_value.rb`
- `Callbacks` `extended` — `vendor/rails/v8.0.2/activemodel/lib/active_model/callbacks.rb`
- `Naming` `extended` / `inherited` — `vendor/rails/v8.0.2/activemodel/lib/active_model/naming.rb`
- `AttributeMethods` `inherited` — `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb`
- `Validations` `inherited` — `vendor/rails/v8.0.2/activemodel/lib/active_model/validations.rb`

`inherited` has no JS hook; CLAUDE.md § "`inherited` is deferred to own-property memo guards" ratifies
the deferral for `ModelSchema` only. Each activemodel `inherited` needs the same treatment or a
documented equivalent.

## Acceptance criteria

- [ ] Each `included`/`extended` body above is ported through the symbol-keyed callback (`Symbol.for("@blazetrails/ruby-compat:included")` / `extended`) and exercised by a test.
- [ ] Each `inherited` body's observable effect (a subclass does not see its parent's memo) is carried by an own-property guard, with a test per hook mirroring the Rails behaviour it protects.
- [ ] The PR body maps each hook to its trails carrier; any hook with no carrier is filed as its own story.

## Verification

```bash
pnpm parity:api && pnpm parity:api:pins && pnpm vitest run scripts/parity/conventions.test.ts
```
