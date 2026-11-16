---
title: "Port PP#pp_object for Kernel#pretty_print's fallback arm"
status: draft
updated: 2026-11-16
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`PP::ObjectMixin#pretty_print` (`vendor/ruby/v3.3.11/lib/pp.rb:321-334`) falls back to `q.pp_object(self)` when `inspect` is Kernel's. That prints instance variables with group and breakable layout. ruby-compat's `Kernel.prettyPrint` seat (`packages/ruby-compat/lib/pp.ts`, added in trails#10192) prints `rbInspect(this)` instead, and `PP#pp_object` (`pp.rb`) is not ported.

## Acceptance criteria

- [ ] `PP#ppObject` is ported (`pretty_print_instance_variables`, `object_address_group`, `seplist`, `breakable`).
- [ ] `Kernel.prettyPrint` takes the `pp_object` arm for an object with no `inspect` of its own.
