---
title: "Clusivity#include? public_sends inclusion_method instead of hand-rolled instanceof membership"
status: draft
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `Clusivity#check_validity!` in trails#8288.

`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/clusivity.rb:21-29`:

```ruby
def include?(record, value)
  members = resolve_value(record, delimiter)

  if value.is_a?(Array)
    value.all? { |v| members.public_send(inclusion_method(members), v) }
  else
    members.public_send(inclusion_method(members), value)
  end
end
```

`packages/activemodel/src/validations/clusivity.ts` (`isInclude`) passes the
method name to two same-file helpers that Rails does not have, `testMembership`
and `isMemberOf`. Those helpers hand-roll the dispatch: `instanceof Range`,
`instanceof Set || Map`, `Array.isArray`, `typeof includes/has === "function"`,
and an iterator walk. As a result, a delimiter that answers `include?` through
a ported `isInclude` method (anything other than a core JS collection or
`Range`) is never asked. This is also the last `instanceof` duck test left in
the file, now that trails#8288 moved `check_validity!` onto `rbObjRespondTo`.

## Converged shape

`isInclude` makes the `public_send` Rails makes, through ruby-compat's
`rbFPublicSend(members, <ts spelling of inclusion_method(members)>, v)`. Core
JS receivers (String, Array, Set, Map, plain hash) need an `include?` send
answer in ruby-compat, the same way `basicObjRespondTo` answers `isInclude` for
them since trails#8288. `testMembership` and `isMemberOf` are deleted.

## Acceptance criteria

- [ ] `isInclude` mirrors `clusivity.rb:21-29`: `resolveValue`, then the Array
      arm with `every`, then the scalar arm, each doing one public send of
      `inclusionMethod(members)`.
- [ ] `testMembership` and `isMemberOf` are gone. No `instanceof` is left in
      `clusivity.ts` outside `inclusionMethod` (Rails' `is_a? Range`).
- [ ] The inclusion/exclusion validation tests and `clusivity.trails.test.ts`
      stay green, and a delimiter object with only an `isInclude` method
      validates membership through it.
- [ ] `pnpm parity:api:calls` shows no new rows.
