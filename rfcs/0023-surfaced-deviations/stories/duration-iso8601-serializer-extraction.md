---
title: "Duration#iso8601 inlines what Rails delegates to ISO8601Serializer"
status: ready
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails builds the ISO8601 form of a `Duration` through a separate serializer
object: `iso8601(precision: nil)` is
`ISO8601Serializer.new(self, precision: precision).serialize`
(`vendor/rails/activesupport/lib/active_support/duration.rb:473-475`), with the
class in `vendor/rails/activesupport/lib/active_support/duration/iso8601_serializer.rb`.

`packages/activesupport/src/duration.ts`'s `iso8601` inlines the whole string
build instead. The divergence was invisible until PR #5353 added
`Messages::Codec#serialize`, which put `serialize` into the api-compare
wide-call population; the `iso8601` -> `serialize` pair is now baselined in
`scripts/api-compare/call-mismatches-wide-exclude/activesupport/duration.json`
(the `iso8601` -> `new` half was already baselined before).

## Acceptance criteria

- Port `duration/iso8601_serializer.rb` to
  `packages/activesupport/src/duration/iso8601-serializer.ts`.
- Reduce `Duration#iso8601` to constructing it and calling `serialize`.
- Drop both `iso8601` entries from the duration wide-call exclude file.
- Existing duration tests keep passing; `api:compare --package activesupport`
  non-negative.
