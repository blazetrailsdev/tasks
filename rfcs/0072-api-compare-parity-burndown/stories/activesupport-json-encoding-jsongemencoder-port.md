---
title: "Port json/encoding.rb's JSONGemEncoder and remaining Encoding accessors"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6134
claim: "2026-08-05T16:13:06Z"
assignee: "abstract-adapter-pool-readers-soften-rails-behaviour"
blocked-by: null
closed-reason: null
---

## Context

PR #5632 added `packages/activesupport/src/json/encoding.ts` holding a single
member — `Encoding.useStandardJsonTimeFormat` — because
`Messages::Metadata#parse_expiry` switches on it
(`vendor/rails/activesupport/lib/active_support/messages/metadata.rb:114-120`,
flag defined at `json/encoding.rb:117,132` and delegated from `ActiveSupport` at
`json/encoding.rb:8-12`).

The file's existence changed what parity:api can see: `json/encoding.rb` reads
0/13 methods, and `JSONGemEncoder` now scores as an inheritance `class missing`
where previously the whole file was skipped as "file missing" (compare.ts
decrements `inheritance.checked` in that case). Same unported code either way —
it is now counted. activesupport inheritance reads 54/60 rather than 54/59.

Unported in `json/encoding.rb`: `JSONGemEncoder` (and its `encode`,
`jsonify`, `stringify`, `EscapedString`), plus the `escape_html_entities_in_json`,
`time_precision`, and `json_encoder` accessors. trails' `ActiveSupportJSON.encode`
(`packages/activesupport/src/json.ts`) hand-rolls the `as_json` traversal and
delegates to `JSON.stringify` instead.

## Acceptance criteria

- Port `json/encoding.rb` into `packages/activesupport/src/json/encoding.ts`
  under the Rails layout: the remaining `Encoding` accessors and `JSONGemEncoder`.
- `ActiveSupportJSON.encode` routes through the ported encoder rather than
  duplicating the traversal, or the duplication is justified at the call site.
- parity:api activesupport `json/encoding.rb` rises and the `JSONGemEncoder`
  inheritance mismatch clears.
