---
title: "metadata-data-set-carries-a-time"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6129
claim: "2026-08-05T15:59:24Z"
assignee: "vendor-ruby-date-gem"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activesupport/test/messages/message_metadata_tests.rb:133-137`
gives `DATA` three entries, and its second and third each carry a
`Time.local(2004)`. The trails port
(`packages/activesupport/src/messages/message-metadata-tests.ts`) still ships
the two composite entries without a temporal value.

The MessagePack serializer arm was added by the PR closing
`activesupport-metadata-message-pack-serializer-matrix`, so the `:message_pack`
arm would carry the time fine. Two arms still would not:

- `:marshal` — trails has no Ruby Marshal runtime, so the format is backed by
  `cache/coder.ts` (`messages/serializer-with-fallback.ts:11-14`), which
  flattens a `Temporal.Instant` to `{}` rather than roundtripping it.
- `:json` / `CustomSerializer` — a time decodes back as a string. Rails' own
  assertions only hold here because Ruby's `Time#<=>` coerces a String operand
  through `to_datetime <=> other`
  (`activesupport/lib/active_support/core_ext/time/calculations.rb:329-343`);
  JS `toEqual` has no such coercion.

## Acceptance criteria

- [ ] `cache/coder.ts` roundtrips a `Temporal.Instant`, so the `:marshal` arm
      returns the time it was given.
- [ ] `DATA` in `message-metadata-tests.ts` matches Rails' three entries,
      including `Time.local(2004)` in the second and third.
- [ ] The JSON-family arms compare the way Rails' `assert_equal` does — the
      coercion is stated where it is relied on, not worked around by dropping
      the value.
- [ ] `pnpm parity:test --package activesupport` non-negative.
