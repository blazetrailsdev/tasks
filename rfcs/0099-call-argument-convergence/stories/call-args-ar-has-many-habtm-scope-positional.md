---
title: "hasMany and hasAndBelongsToMany take Rails' scope positional"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6375
claim: "2026-08-11T20:06:07Z"
assignee: "pg-reset-body-under-one-lock"
blocked-by: null
closed-reason: null
---

## Context

Left over from `call-args-ar-dropped-argument` (RFC 0099, PR #6373). That PR
gave `belongsTo` and `hasOne` Rails' `scope` positional — the two the RFC 0095
call-argument baseline had rows for:

```ruby
# vendor/rails/activerecord/lib/active_record/associations.rb
def has_one(name, scope = nil, **options)            # :1498
  reflection = Builder::HasOne.build(self, name, scope, options)
def belongs_to(name, scope = nil, **options)         # :1689
  reflection = Builder::BelongsTo.build(self, name, scope, options)
```

`has_many` (`associations.rb:1302`) and `has_and_belongs_to_many`
(`associations.rb:1870`) have the SAME `(name, scope = nil, **options)`
signature and forward `scope` to their builders the same way, but had no
baseline row — so `packages/activerecord/src/associations.ts` still declares
`hasMany(name, options)` and `hasAndBelongsToMany(name, options)` and calls
`HasManyBuilder.build(this, name, options)` /
`HabtmBuilder.build(this, name, options, {...})` with the `scope` slot dropped.

The macro family is now inconsistent — two of the four take Rails' scope
positional and two do not. `Builder::Association.build`
(`associations/builder/association.ts:78-92`) already shifts a plain options
object out of the `scope` slot, which is what makes the change
backward-compatible for existing two-argument call sites; `belongsTo`/`hasOne`
in PR #6373 are the worked example.

## Acceptance criteria

1. `hasMany` and `hasAndBelongsToMany` take Rails' `scope` positional with
   Rails' default and forward it to their builders, matching
   `associations.rb:1302-1303` and `:1870-1871`.
2. Existing two-argument call sites (`hasMany("posts", { className: … })`)
   keep working through the builder's options-object shift.
3. `pnpm parity:api:calls:args` stays green and no new row is added for either
   macro.
