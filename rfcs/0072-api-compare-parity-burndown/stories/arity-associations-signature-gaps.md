---
title: "associations arity gaps: get_chain, update_through_counter?, autosave, nested_error"
status: done
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: arity-fidelity
deps:
  [
    "arity-skip-ruby-delegate-entries",
    "arity-collapse-required-kwargs-into-options-object",
    "arity-resolve-ts-alias-bindings-to-target-params",
  ]
deps-rfc: []
est-loc: 250
priority: null
pr: 5330
claim: "2026-07-25T23:10:51Z"
assignee: "arity-associations-signature-gaps"
blocked-by: null
closed-reason: null
---

## Context

Association-cluster arity mismatches from `output/arity-mismatches.json`
where the TS signature genuinely diverges from Rails:

- `get_chain(reflection, association, tracker)`
  (`vendor/rails/activerecord/lib/active_record/associations/association_scope.rb`,
  `pnpm rails:find get_chain`) vs TS `getChain(reflection, tracker = …)`
  (`packages/activerecord/src/associations/association-scope.ts`) — TS drops
  the `association` param Rails uses for runtime-reflection instantiation.
- `update_through_counter?(method)`
  (`vendor/rails/activerecord/lib/active_record/associations/has_many_through_association.rb`)
  vs TS `(throughReflection, method)`
  (`packages/activerecord/src/associations/has-many-through-association.ts`) —
  Ruby reads `through_reflection` from the association instance; the TS port
  threads it positionally. Converge to the `this`-typed mixin convention
  (CLAUDE.md) so the signature matches.
- `association_valid?(association, record)` and
  `compute_primary_key(reflection, record)` (autosave_association.rb, reported
  under both `autosave_association.rb` and `base.rb`) vs TS
  `associationValid`/`computePrimaryKey` in
  `packages/activerecord/src/autosave-association.ts:1205` — TS
  `computePrimaryKey(this: AutosaveAssociationHost, reflection)` uses `this`
  as the record; Rails passes `record` explicitly (the caller iterates
  records). Verify each call site and converge the param lists.
- `nested_error.rb` `index_errors_setting()` / `ordered_records()` — Ruby
  zero-arg readers of instance state vs TS `(err)` free functions
  (`packages/activerecord/src/associations/nested-error.ts`) — converge to
  `this`-typed or justify into the arity exclude with a reason.

Do NOT trust the reported `ts()` ranges until
arity-resolve-ts-alias-bindings-to-target-params lands — re-derive from
`output/arity-mismatches.json` after the tooling stories merge.

## Acceptance criteria

- Each listed method's TS signature converges to the Rails positional list
  (modulo the documented `this`-receiver strip), or lands in the arity
  exclude with a call-site reason per the deviation rules.
- All call sites updated; touched test files pass; no test renames.
- `output/arity-mismatches.json` regenerated: the listed
  association_scope/has_many_through/autosave/nested_error entries gone or
  excluded-with-reason.
