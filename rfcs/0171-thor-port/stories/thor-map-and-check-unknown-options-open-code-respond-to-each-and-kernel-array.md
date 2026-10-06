---
title: "Thor.map and check_unknown_options! call respond_to?(:each) and Kernel#Array through ruby-compat"
status: done
updated: 2026-10-06
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8567
claim: "2026-10-06T12:29:04Z"
assignee: "port-api-controller-tests"
blocked-by: null
closed-reason: null
---

## Context

Two bodies in `packages/trailties/src/thor/thor.ts` (trails#8475) open-code a Ruby call ruby-compat cannot
answer yet.

- `Thor.map` (`vendor/thor/v1.3.2/lib/thor.rb:110-116`) branches on `key.respond_to?(:each)`. The port
  (`thor.ts:164`) writes `Array.isArray(key)`, because `rbObjRespondTo(["-h"], "each")` answers `false`:
  ruby-compat has no method table for a JS Array, so `respond_to?` cannot see `Array#each`. Any other
  `each`-responding key (a Set, a Range) takes the wrong arm.
- `Thor.check_unknown_options!` (`thor.rb:354`) stores `Array(value)`. The port (`thor.ts:263`) writes
  `Array.isArray(value) ? value : [value]`. `Kernel#Array` is `rb_Array`, whose port is owned by
  `thor-option-normalize-aliases-open-codes-kernel-array`; this is one more call site for it.

## Acceptance criteria

- [ ] `rbObjRespondTo` answers `each` for a JS Array (and the other core `each` receivers trails models), with
      a `vendor/ruby/v3.3.11` citation, and `Thor.map` calls `rbObjRespondTo(key, "each")`.
- [ ] `Thor.checkUnknownOptionsBang` calls the ruby-compat `rb_Array` port once
      `thor-option-normalize-aliases-open-codes-kernel-array` lands it.
- [ ] `thor.trails.test.ts` covers a non-Array `each`-responding `map` key.
