---
title: "middle_options invents an else arm and two option keys Rails does not set"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 29
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Read while converging `options.key? :foreign_key` in PR #7321 (RFC 0129). The
`key?` call is now faithful; the branch around it is not.

Rails
(`activerecord/lib/active_record/associations/builder/has_and_belongs_to_many.rb:71-78`):

```ruby
def middle_options(join_model)
  middle_options = {}
  middle_options[:class_name] = "#{lhs_model.name}::#{join_model.name}"
  if options.key? :foreign_key
    middle_options[:foreign_key] = options[:foreign_key]
  end
  middle_options
end
```

Three keys, one guarded assignment, **no else**.

trails
(`packages/activerecord/src/associations/builder/has-and-belongs-to-many.ts:138-149`)
has an `else` arm Rails does not — `middleOptions.foreignKey =
joinModel.leftReflection.foreignKey` — and two keys Rails never sets:
`middleOptions.anonymousClass = joinModel` and `middleOptions.dependent =
"delete"`. In Rails the join reflection derives its own foreign key when the
option is absent, and `:anonymous_class` / `:dependent` are set elsewhere
(`has_and_belongs_to_many.rb`'s `builder` / the `has_many` it builds), so the
extra arms are a shortcut, not a translation.

## Converged shape

The body above, line for line: `className`, the `hasKey(this.options,
"foreignKey")` guard with no else, and nothing more. Whatever the dropped `else`
and the two extra keys are actually load-bearing for has to move to the Rails
site that sets them — find it before deleting, and pin it with the existing
HABTM association tests.

## Acceptance criteria

- `middleOptions` sets `className` and, only under the `key?` guard,
  `foreignKey`; the `else` arm and the `anonymousClass` / `dependent` keys are
  gone from this method.
- Whatever those covered is set where Rails sets it, cited by `file.rb:LINE`.
- The habtm association suites stay green on all three adapter lanes.
- `pnpm parity:api:calls` and `parity:api:calls:args` show no new rows.
