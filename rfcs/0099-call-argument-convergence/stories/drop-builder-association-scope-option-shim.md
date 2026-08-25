---
title: "Drop the Builder::Association options-bag scope shim so :scope is invalid as Rails has it"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6512
claim: "2026-08-14T11:46:26Z"
assignee: "drop-builder-association-scope-option-shim"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Builder::Association::VALID_OPTIONS`
(`vendor/rails/activerecord/lib/active_record/associations/builder/association.rb:20-22`)
is exactly:

```ruby
VALID_OPTIONS = [
  :class_name, :anonymous_class, :primary_key, :foreign_key, :dependent, :validate, :inverse_of, :strict_loading, :query_constraints
].freeze
```

`:scope` is **not** in it, and `create_reflection` calls `validate_options` →
`options.assert_valid_keys(valid_options(options))` (`association.rb:43,70`), so
`has_many :xs, scope: -> { ... }` raises `ArgumentError: Unknown key: :scope` in
Rails. The scope only ever arrives as the second positional
(`associations.rb:1302,1870`).

trails diverges in two places in
`packages/activerecord/src/associations/builder/association.ts`:

- `VALID_OPTIONS` carries an extra `"scope"` entry (line 75), so the bag
  spelling passes `assertValidKeys` instead of raising.
- `createReflection` lifts it back out (lines 125-128):
  `if (!scope && typeof options.scope === "function") { scope = options.scope; ... }`
  — a shim Rails has no counterpart for.

A third residue is in `associations/builder/has-and-belongs-to-many.ts:336-339`:
the positional scope is written back onto `habtmOptions.scope` purely so the
through-routing loaders can read it off the options bag. Rails keeps the scope
on the reflection (`HasAndBelongsToManyReflection.new(name, scope, options, ...)`,
`associations.rb:1871`), never on the options hash.

PR #6502 removed the last canonical-model caller of the bag spelling and
narrowed the HABTM builder to the positional; the generic shim above is what is
left.

## Blocked on

`test-files-scope-positional-sweep` — ~73 AR test-file callers still pass
`scope:` in the bag and would start raising.

## Converged shape

- Drop `"scope"` from `Builder::Association.VALID_OPTIONS` so it matches
  `association.rb:20-22` exactly.
- Delete the `createReflection` lift; the scope reaches `Reflection.create`
  only via the positional, as in `association.rb:43`.
- Have the through-routing loaders read the scope off the reflection rather
  than `options.scope`, and drop the `habtmOptions.scope` write-back.

## Acceptance criteria

- [ ] `Builder::Association.VALID_OPTIONS` matches Rails' list member-for-member.
- [ ] `hasMany("x", { scope: fn })` raises the Rails `Unknown key: :scope`
      `ArgumentError`.
- [ ] No `options.scope` read remains on the association-building or
      through-routing paths.
- [ ] `pnpm parity:api:calls` / `:args` green; association suites green.
