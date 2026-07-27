---
title: "Track: zero-arg method vs getter shape convention"
status: ready
updated: 2026-07-27
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Track: zero-arg method vs getter shape convention

## Context

A Ruby zero-arg method can port as a TS `get` accessor or a `()` method; the
wrong pick changes every call site (`x.foo` vs `x.foo()`) and the api-compare
args gate counts the mismatch. There is currently no written rule in
`scripts/api-compare/conventions.ts` deciding which shape a Ruby attr-reader or
zero-arg method takes, so ports pick inconsistently. Known cases:
`joinSources` is a getter but should be a method
(`packages/arel/src/select-manager.ts:436`; Rails
`vendor/rails/activerecord/lib/arel/select_manager.rb` `join_sources`);
`hasChangesToSave` is a getter; the export-let-to-accessor sweep exposed wide
call-site mismatches when shapes flipped.

Existing scattered stories (reference, do not re-home):
`arel-join-sources-getter-should-be-method` (0072, ready),
`route-fixture-machinery-off-deprecated-getter` (0073, done). Writer-side
siblings live in RFC 0081-writer-accessor-convergence (not this story's scope).

## Acceptance criteria

- A decided convention rule (getter vs method for Ruby zero-arg
  methods/attr-readers) added to `conventions.ts` and thus the generated
  docs/ruby-ts-conventions.md.
- Extractor-driven inventory of shape mismatches against that rule; divergent
  sites fixed or registered as child stories here.
- The ready story above resolved consistently with the new rule.
