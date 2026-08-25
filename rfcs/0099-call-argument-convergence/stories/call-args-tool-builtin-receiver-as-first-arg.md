---
title: "Comparator: compare the Ruby receiver against TS argument 1 for unmonkey-patchable built-ins (29 rows)"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6351
claim: "2026-08-11T11:44:18Z"
assignee: "call-args-tool-builtin-receiver-as-first-arg"
blocked-by: null
closed-reason: null
---

## Context

Filed by the RFC 0099 classification pass (PR #6348). 29 `activerecord` rows
are the receiver of an unmonkey-patchable built-in method surfacing as a TS
argument.

Ruby writes `name.to_s.singularize`, `columns_hash.values`,
`class_name.safe_constantize`, `select_values.many?`, `td.comment.presence`.
TS cannot monkey-patch `String.prototype` / `Object.prototype`, so
`@blazetrails/activesupport` exports these as free functions and the port calls
`singularize(name)` — the Ruby _receiver_ becomes TS argument 1. The comparator
compares argument lists only, so it reads Ruby `()` vs TS `(ref:name)` and
flags a shape divergence at every site. Verified instances include
`reflection.rb:454` `name.to_s.camelize`, `model_schema.rb:479`
`columns.map(&:name).freeze`, `insert_all.rb:36` `@scope_attributes.keys`,
`token_for.rb:24` `...as_json`, `inheritance.rb:188` `name.demodulize`.

**Scope guard:** this is NOT the general "host passed explicitly" case. Where
the port passes a model/association host to a ported module function
(`polymorphicName(klass)`, `throughReflection(assoc)`), the settled trails
idiom is a `this`-typed function assigned to the class, the call SHOULD be
`Klass.polymorphicName()`, and those ~137 rows are genuine divergence filed as
the `call-args-ar-host-param-*` stories. Only methods that cannot be defined on
the receiver in TS qualify — a curated list of Ruby built-ins and
ActiveSupport core-exts on `String`/`Hash`/`Array`/`Object`/`Enumerable`.

## Acceptance criteria

1. For calls whose name is on the curated built-in/core-ext list, the Ruby
   receiver expression is compared against TS argument 1 and the remaining
   arguments are compared pairwise.
2. The list lives next to the other extractor conventions, one entry per name,
   and is not open-ended — adding a Rails-defined method to it is out of
   bounds.
3. The 29 bucket-(b) rows go stale and are deleted from the baseline.
4. `pnpm parity:api:calls:args` is green and the total row count strictly
   decreases.
