---
title: "activerecord: Preloader.new's stub seam is one ruby-compat Class#new, not a per-class static"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord", "ruby-compat", "activesupport"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-associations` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`packages/activerecord/src/associations/preloader.ts` defines `static new(options)` returning
`new this(options)`, under `@noRailsEquivalent`. It was added by trails#8066 so
`assert_not_called(ActiveRecord::Associations::Preloader, :new)`
(`vendor/rails/v8.0.2/activerecord/test/cases/associations/has_many_through_associations_test.rb:898`)
has a method to stub: Ruby's `Class#new` is an ordinary method, JS `new X` is syntax. The three Rails
call sites — `vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:1326` and
`associations/preloader/through_association.rb:71,79` — spell `Preloader.new({...})` in trails for
that reason.

No CLAUDE.md section ratifies a per-class `static new`. § "Ruby protocol methods with a different JS
mechanism" decides `is_a?`, `hash` / `eql?` and `method_missing` / `respond_to?`; `Class#new` is not
among them. The same seam is hand-written on five other classes (`DeprecationProxy`,
`DeprecatedConstantProxy`, `Subscribers`, `Time`, `Tempfile`), each its own shape.

The convergence is one ruby-compat port of `Class#new` (`vendor/ruby/v3.3.11/object.c:2135`
`rb_class_new_instance_pass_kw`) that a call site names and a test can stub — not a member re-declared
per class.

## Acceptance criteria

- [ ] ruby-compat ports `Class#new` once, with its MRI anchor, receipt and unit tests, in a shape `assertNotCalled` / `assertCalled` can watch.
- [ ] `Preloader`'s `static new` and its receipt are deleted; the three call sites and `has-many-through-associations.test.ts`'s `assertNotCalled(Preloader, "new", …)` go through the ruby-compat port.
- [ ] `pnpm parity:api:extra:gate`, `:calls`, `:calls:args` and `parity:test:assertions` green.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm vitest run packages/activerecord/src/associations/has-many-through-associations.test.ts -t "preload"
```
