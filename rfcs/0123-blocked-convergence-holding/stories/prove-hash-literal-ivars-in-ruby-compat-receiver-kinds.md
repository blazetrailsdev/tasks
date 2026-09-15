---
title: "prove-hash-literal-ivars-in-ruby-compat-receiver-kinds"
status: blocked
updated: 2026-09-15
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: "Admitting hash-literal ivars surfaces the mime_responds.rb:250,280-282 ruby-compat row, whose convergence is converge-mime-responds-collector-responses-hash (RFC 0141, still draft); AC requires no new baseline rows. Unblock when that story lands."
closed-reason: null
---

## Context

trails#7739 taught `scripts/api-compare/extract-ruby-api.rb` `hash_typed_ivars`
to prove an ivar is a Hash (receiver kind `hash`, which admits the
`RECEIVER_KEYED_RUBY_COMPAT_EXPORTS` rows in `scripts/parity/ruby-compat.ts`)
when every plain `@x = …` in its lexical class assigns a `to_hash` call
(`activerecord/lib/active_record/fixture_set/table_row.rb:69`). Hash-literal
assignments (`@x = {}`) are equally proving but were left out, because admitting
them surfaces two ruby-compat ratchet rows:

- `rack/lib/rack/cascade.rb:25,47` — `@cascade_for = {}` then
  `@cascade_for.include?(result[0].to_i)`. Converged shape:
  `packages/rack/src/cascade.ts` `call` reads
  `hasKey(this.cascadeFor, Number(result[0]))` (import from ruby-compat), and the
  stale `call include?` row in `call-mismatches-exclude/rack/cascade.json` is deleted.
- `actionpack/lib/action_controller/metal/mime_responds.rb:250,280-282` —
  `@responses = {}` then `!@responses.fetch(format, false) && @responses[Mime::ALL]`.
  Converging it is `converge-mime-responds-collector-responses-hash` (dep).

## Acceptance criteria

- `hash_typed_ivars` also admits `:hash` / `:bare_assoc_hash` plain assignments,
  with an extractor regression.
- `cascade.ts` converged as above; `pnpm exec tsx scripts/api-compare/lint-ruby-compat-calls.ts`,
  `parity:api:calls` and `:calls:args` green with no new baseline rows.
