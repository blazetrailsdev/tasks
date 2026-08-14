---
title: "assert_valid_keys uses Rails' flatten!/include?, not a TS-only Set"
status: done
updated: 2026-08-14
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 6494
claim: "2026-08-13T21:27:10Z"
assignee: "drop-assert-valid-keys-set-for-rails-include"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/hash-utils.ts#assertValidKeys` builds a TS-only
`new Set(validKeys)` (hash-utils.ts:192) to test membership. Rails has no such
object:

    # activesupport/lib/active_support/core_ext/hash/keys.rb:50-54
    def assert_valid_keys(*valid_keys)
      valid_keys.flatten!
      each_key do |k|
        unless valid_keys.include?(k)
          raise ArgumentError.new("Unknown key: #{k.inspect}. Valid keys are: #{valid_keys.map(&:inspect).join(', ')}")
        end
      end
    end

It calls `valid_keys.flatten!` and then `include?` per key. The `Set` is extra
surface with no Ruby counterpart — the CLAUDE.md "no abstraction Rails does not
have" rule — and it was what pinned `constructor` at the head of this body's
call sequence before PR #6464's raise-position `new` filter retired the row.

## Converged shape

Drop the `Set`; flatten the varargs as Rails does and use a plain `includes`
per key, so the body reads as `keys.rb:50-54` does.

## Acceptance criteria

- [ ] `assertValidKeys` has no `new Set`; it flattens `validKeys` and tests
      membership per key, mirroring keys.rb:50-54.
- [ ] The `ArgumentError` message and raise site are unchanged (they are already
      pinned by `assert-valid-keys-message-format-fidelity`).
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:extra` do not regress;
      activesupport hash suites green.
