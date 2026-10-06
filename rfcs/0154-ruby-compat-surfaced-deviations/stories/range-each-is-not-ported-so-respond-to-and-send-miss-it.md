---
title: "Range#each is not ported, so respond_to?(:each) and send(:each) miss a Range"
status: draft
updated: 2026-10-06
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8567 bound `each` in ruby-compat for a JS Array, `Set`, `Map` and plain hash:
`basicObjRespondTo` answers it and `rbFSend` dispatches it
(`packages/ruby-compat/src/object.ts`; `vendor/ruby/v3.3.11/array.c:8642`, `lib/set.rb:499`,
`hash.c:7219`). `Range` also defines `each` (`vendor/ruby/v3.3.11/range.c:2647` `range_each`), but
ruby-compat's `Range` (`packages/ruby-compat/src/range.ts`) has no `each` member, only `toA`, so
`rbObjRespondTo(new Range(1, 3), "each")` answers `false` and `rbFSend(range, "each", block)` raises
`NoMethodError`. `Thor.map` (`vendor/thor/v1.3.2/lib/thor.rb:110-116`) takes its non-`each` arm for a Range
key.

## Acceptance criteria

- `Range` ports `range_each` (`range.c:1004`) at its Ruby name, including the `TypeError` "can't iterate
  from …" arm for a non-iterable begin.
- `rbObjRespondTo(range, "each")` is true and `rbFSend(range, "each", block)` yields each element.
- A trails test covers both, and a Range `Thor.map` key.
