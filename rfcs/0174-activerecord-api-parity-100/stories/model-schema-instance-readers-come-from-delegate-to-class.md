---
title: "activerecord: ModelSchema's instance readers come from delegate ..., to: :class"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord", "activesupport"]
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

Surfaced by the `activerecord-audit-permanent-receipts-root-a-m` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`ModelSchema`'s `included` block (`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb:162-186`) ends with

```ruby
delegate :type_for_attribute, :column_for_attribute, to: :class
```

`packages/activerecord/src/model-schema.ts` writes the two methods out by hand in an exported
`InstanceMethods` object (`@noRailsEquivalent`), which `base.ts` includes separately, and the
`[included]` hook has no `delegate` call.

Tried in the audit PR: `delegate.call(base.prototype, "typeForAttribute", "columnForAttribute",
{ to: "class" })` from `@blazetrails/activesupport`. `Delegation.generate`
(`packages/activesupport/src/delegation.ts`) resolves `to: "class"` by reading a `class` property
off the receiver, and a record has none: Ruby's `self.class` is `this.constructor`. activesupport's
own test defines a `get class()` on its fixture class to get past that.

## Converged shape

`Delegation.generate` reads the `self.class` receiver as `constructor`, the `[included]` hook makes
the `delegate` call where Rails makes it, and `InstanceMethods` and its `include(Base, …)` are
deleted. Every other hand-written `delegate …, to: :class` port in activerecord
(`grep -n "to: :class" vendor/rails/v8.0.2/activerecord/lib/active_record/**/*.rb`) can then follow the same route; list them when claiming.

## Acceptance criteria

- [ ] `delegate.call(proto, …, { to: "class" })` works on a class with no `class` accessor, with an activesupport test.
- [ ] `ModelSchema[included]` calls `delegate` for `typeForAttribute` / `columnForAttribute`; `InstanceMethods` and its receipt are deleted.
- [ ] `pnpm parity:api:extra:gate`, `pnpm parity:api:calls` and `pnpm parity:api:receipts:gate` stay green.
