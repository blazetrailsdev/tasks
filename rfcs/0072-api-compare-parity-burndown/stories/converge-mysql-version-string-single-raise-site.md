---
title: "version_string raises from one else arm, not three"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6113
claim: "2026-08-05T02:15:00Z"
assignee: "converge-mysql-version-string-single-raise-site"
blocked-by: null
closed-reason: null
---

## Context

`AbstractMysqlAdapter#version_string`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:1018-1023`)
is one branch over one message:

```ruby
def version_string(full_version_string)
  if full_version_string && matches = full_version_string.match(/^(?:5\.5\.5-)?(\d+\.\d+\.\d+)/)
    matches[1]
  else
    raise DatabaseVersionError, "Unable to parse MySQL version from #{full_version_string.inspect}"
  end
end
```

`nil`, `""` and a non-matching banner all take the same `else`, and
`#{...inspect}` renders them as `nil`, `""` and `"garbage"` respectively.

`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:1743-1756`
splits that one `else` into three raise sites with three hand-built messages —
an explicit `== null` arm spelling `"Unable to parse MySQL version from nil"`, an
explicit `.length === 0` arm spelling `from ""`, and a fallback using
`JSON.stringify`. Three branches where Rails has one, and the error text is
reconstructed per arm rather than falling out of one interpolation.

This is a plain decomposition divergence, not a language shortcoming: the guard
Rails writes as a truthiness check on `full_version_string` ports as
`fullVersionString != null && fullVersionString !== ""` (Ruby `""` is truthy, so
the empty string actually reaches `match` and fails there — worth confirming
against the interpreter before collapsing the arm).

## Converged shape

One `if` over the combined condition and one `raise` in the `else`, with the
message built from a single Ruby-`inspect` rendering of `fullVersionString`
(`nil` for a nullish value, otherwise the quoted string). Rails' `nil` spelling
is what the existing `"...from nil"` text already produces, so the observable
messages should not move.

## Acceptance criteria

- [ ] One raise site, matching `abstract_mysql_adapter.rb:1018-1023`'s branch count.
- [ ] `nil`, `""` and a garbage banner produce the same message strings ruby
      produces, verified against the interpreter.
- [ ] `abstract-mysql-adapter.test.ts`'s existing `DatabaseVersionError` cases
      stay green without their expectations being reworded.
