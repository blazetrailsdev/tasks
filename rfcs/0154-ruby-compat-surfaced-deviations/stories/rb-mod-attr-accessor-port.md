---
title: "Port Module#attr_accessor as rbModAttrAccessor"
status: draft
updated: 2026-11-17
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Module#attr_accessor` is `rb_mod_attr_accessor`
(`vendor/ruby/v3.3.11/object.c:2367`, bound at `:4449`). ruby-compat ports
only `rbModAttrReader` / `rbModAttrWriter`
(`packages/ruby-compat/lib/object.ts:1234,1245`), so a one-line Ruby
`attr_accessor :id, :name` is two calls in trails:
`packages/turbo/test/dummy/app/models/company.ts` and
`packages/turbo/test/dummy/app/models/users/profile.ts`
(turbo-rails `test/dummy/app/models/company.rb:4`, `users/profile.rb:6`).
trails#10262 had to take the two-call form.

## Acceptance criteria

- `rbModAttrAccessor(klass, ...argv)` ports `rb_mod_attr_accessor`, calling
  `rbAttr(klass, id, true, true)` per name, with its MRI citation.
- The two turbo dummy models, and other paired reader+writer call sites that
  mirror a Ruby `attr_accessor`, use the single call.
