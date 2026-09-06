---
title: "reflection_class_for must raise Unsupported Macro, not fall back to AssociationReflection"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: exclude-burndown
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `Reflection.create` in #6206, which moved the
`composed_of` arm into `reflectionClassFor`
(`packages/activerecord/src/reflection.ts`, ~line 2271).

Rails (`vendor/rails/activerecord/lib/active_record/reflection.rb:34-47`):

```ruby
def reflection_class_for(macro)
  case macro
  when :composed_of then AggregateReflection
  when :has_many    then HasManyReflection
  when :has_one     then HasOneReflection
  when :belongs_to  then BelongsToReflection
  else
    raise "Unsupported Macro: #{macro}"
  end
end
```

trails' `reflectionClassFor` diverges on two arms:

- it adds a `"hasAndBelongsToMany"` case returning `HasAndBelongsToManyReflection`,
  which Rails has no case for (Rails builds habtm through the generated
  has_many/join model, so `:has_and_belongs_to_many` never reaches
  `reflection_class_for`);
- its `default:` returns `AssociationReflection` where Rails raises
  `RuntimeError("Unsupported Macro: #{macro}")`, so an unknown macro silently
  produces a generic reflection instead of failing loudly.

## Converged shape

Raise `new RuntimeError(\`Unsupported Macro: ${macro}\`)`from the default arm,
matching reflection.rb:45. Establish whether the`hasAndBelongsToMany` case is
still reached — if the habtm macro is meant to route through the generated
has_many like Rails, remove the case; if it is a trails-only entry point, note
why at the arm.

## Acceptance criteria

- [ ] `reflectionClassFor`'s default arm raises with Rails' message and class.
- [ ] The `hasAndBelongsToMany` case is either removed (callers routed through
      the has_many path) or justified at the arm with the trails call site.
- [ ] `packages/activerecord/src/reflection.ts` tests and the habtm association
      suites stay green with no test renames.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
