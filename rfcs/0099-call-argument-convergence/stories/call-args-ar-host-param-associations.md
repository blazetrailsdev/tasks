---
title: "Converge the explicit-host argument in ported associations module functions (28 rows)"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 336
priority: null
pr: 6359
claim: "2026-08-11T13:56:08Z"
assignee: "naming-burndown-activerecord-rest-3"
blocked-by: null
closed-reason: null
---

## Context

Filed by the RFC 0099 classification pass over the 410 `activerecord`
`kind: "args"` rows of the RFC 0095 call-argument baseline — bucket (a),
genuine divergence. 28 rows across 9 files.

Rails calls these as methods on a receiver (`klass.polymorphic_name`, `assoc.through_reflection`); the trails port calls the module function with the host passed as an explicit first argument, so the argument lists differ by one leading ref. CLAUDE.md's settled mixin idiom is a `this`-typed function assigned to the class, which keeps the call spelled `Klass.polymorphicName()` and the argument list identical to Rails. Converge each site to that shape (or to a plain method call on the host) and delete the corresponding baseline row.

Rows live in `scripts/api-compare/call-mismatches-exclude/activerecord/**.json`
with `kind: "args"`, keyed `package + tsFile + rubyName + call + rubyArgs`.

### Rows

- `associations/association-scope.ts` `get_bind_values` → `polymorphic_name`: Rails (`associations/association_scope.rb`) `()` vs trails `(ref:constructor)`
- `associations/association-scope.ts` `get_bind_values` → `polymorphic_name`: Rails (`associations/association_scope.rb`) `()` vs trails `(ref:nextKlass)`
- `associations/association-scope.ts` `last_chain_scope` → `polymorphic_name`: Rails (`associations/association_scope.rb`) `()` vs trails `(ref:constructor)`
- `associations/association-scope.ts` `next_chain_scope` → `polymorphic_name`: Rails (`associations/association_scope.rb`) `()` vs trails `(ref:nextKlass)`
- `associations/association-scope.ts` `transform_value` → `value_transformation`: Rails (`associations/association_scope.rb`) `()` vs trails `(ref:value)`
- `associations/association.ts` `scope` → `global_current_scope`: Rails (`associations/association.rb`) `()` vs trails `(ref:klass)`
- `associations/collection-proxy.ts` `scope` → `scope`: Rails (`associations/collection_proxy.rb`) `()` vs trails `(ref:emptyRel)`
- `associations/has-many-association.ts` `handle_dependency` → `delete_all`: Rails (`associations/has_many_association.rb`) `()` vs trails `(str:nullify)`
- `associations/has-many-association.ts` `handle_dependency` → `new`: Rails (`associations/has_many_association.rb`) `(ref:name)` vs trails `(ref:owner, ref:name)`
- `associations/has-many-association.ts` `update_counter_if_success` → `update_counter_in_memory`: Rails (`associations/has_many_association.rb`) `(ref:difference)` vs trails `(ref:assoc, ref:difference)`
- `associations/has-many-through-association.ts` `build_through_record` → `through_scope_attributes`: Rails (`associations/has_many_through_association.rb`) `()` vs trails `(ref:assoc)`
- `associations/has-many-through-association.ts` `construct_join_attributes` → `ensure_mutable`: Rails (`associations/has_many_through_association.rb`) `()` vs trails `(ref:assoc)`
- `associations/has-many-through-association.ts` `delete_through_records` → `through_records_for`: Rails (`associations/has_many_through_association.rb`) `(ref:record)` vs trails `(ref:assoc, ref:record)`
- `associations/has-many-through-association.ts` `save_through_record` → `build_through_record`: Rails (`associations/has_many_through_association.rb`) `(ref:record)` vs trails `(ref:assoc, ref:record)`
- `associations/has-many-through-association.ts` `through_association` → `through_reflection`: Rails (`associations/has_many_through_association.rb`) `()` vs trails `(ref:assoc)`
- `associations/has-many-through-association.ts` `through_records_for` → `construct_join_attributes`: Rails (`associations/has_many_through_association.rb`) `(ref:record)` vs trails `(ref:assoc, ref:record)`
- `associations/has-many-through-association.ts` `through_scope_attributes` → `through_scope`: Rails (`associations/has_many_through_association.rb`) `()` vs trails `(ref:assoc)`
- `associations/has-one-association.ts` `handle_dependency` → `new`: Rails (`associations/has_one_association.rb`) `(ref:name)` vs trails `(ref:owner, ref:name)`
- `associations/has-one-association.ts` `set_owner_attributes` → `polymorphic_name`: Rails (`associations/has_one_association.rb`) `()` vs trails `(ref:ctor)`
- `associations/has-one-through-association.ts` `construct_join_attributes` → `ensure_mutable`: Rails (`associations/has_one_through_association.rb`) `()` vs trails `(ref:assoc)`
- `associations/has-one-through-association.ts` `create_through_record` → `construct_join_attributes`: Rails (`associations/has_one_through_association.rb`) `(ref:record)` vs trails `(ref:assoc, ref:record)`
- `associations/has-one-through-association.ts` `create_through_record` → `ensure_not_nested`: Rails (`associations/has_one_through_association.rb`) `()` vs trails `(ref:assoc)`
- `associations/has-one-through-association.ts` `create_through_record` → `through_association`: Rails (`associations/has_one_through_association.rb`) `()` vs trails `(ref:assoc)`
- `associations/has-one-through-association.ts` `through_association` → `through_reflection`: Rails (`associations/has_one_through_association.rb`) `()` vs trails `(ref:assoc)`
- `associations/has-one-through-association.ts` `transaction` → `through_reflection`: Rails (`associations/has_one_through_association.rb`) `()` vs trails `(ref:assoc)`
- `associations/nested-error.ts` `initialize` → `compute_attribute`: Rails (`associations/nested_error.rb`) `(ref:innerError)` vs trails `(ref:association, ref:innerError)`
- `associations/preloader/branch.ts` `grouped_records` → `association`: Rails (`associations/preloader/branch.rb`) `()` vs trails `(ref:association)`
- `associations/preloader/branch.ts` `preloaders_for_reflection` → `association`: Rails (`associations/preloader/branch.rb`) `()` vs trails `(ref:association)`

## Acceptance criteria

1. Each call site above passes what the Rails body passes, verified against
   the vendored Rails file named on the row.
2. The corresponding baseline rows are DELETED (only-shrink: a converged row
   goes stale and reds the gate until removed by hand — never `--write`).
3. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green.
4. Anything that genuinely cannot converge keeps a reviewed one-line `reason`
   naming the Rails `file:line` and the blocker — never the seeded placeholder.
