---
title: "call gate reads an instance recv.new(...) call as a constructor"
status: ready
updated: 2026-09-27
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mapper#defaults` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:1045-1050`)
runs `@scope = @scope.new(defaults: merge_defaults_scope(...))`. That is a call
to the INSTANCE method `Scope#new` (`mapper.rb:2351-2353`,
`self.class.new hash, self, scope_level`), and trails makes the same call:
`this._scope.new({ defaults: merged })`
(`packages/actionpack/src/action-dispatch/routing/mapper.ts`, `Scope#new` in
`routing/scope.ts`, renamed from `newChild` by trails#8162).

`rubyMethodToTsWithoutUnderscore` (`scripts/parity/conventions.ts:1656-1657`)
maps every Ruby `new` to `constructor`, so the call gate expects a TS
`new Scope(...)` and reports `defaults → new` as missing. The only receipt that
fits right now is a baseline row with a reason:
`scripts/api-compare/call-mismatches-exclude/actiondispatch/routing/mapper.json`.
The row showed up when trails#8162 exported `Mapping`, which let the gate tell
`Mapper#defaults` apart from `Mapping#defaults`. The identical
`@scope.new(...)` call sites in `controller`, `scope`, `shallow` and the other
scoping methods are masked the same way wherever their pairing is ambiguous.

The existing story `api-compare-pairs-a-ruby-predicate-and-instance-new-onto-one-ts-member`
(RFC 0113) handles the DEFINITION side (`Renderer#new` paired onto
`constructor`). This story is the CALL side.

## Acceptance criteria

- [ ] In the call gate, a Ruby `recv.new(...)` whose receiver is not a
      constant, in a file that defines an instance `def new`, accepts a TS
      `.new(...)` call. It keeps expecting `constructor` for `Klass.new`.
- [ ] The `defaults → new` row in `actiondispatch/routing/mapper.json` is
      deleted, and the shard is removed if that leaves it empty.
- [ ] The call / args ratchets stay green. Any mark that drops is tightened,
      never reseeded.
