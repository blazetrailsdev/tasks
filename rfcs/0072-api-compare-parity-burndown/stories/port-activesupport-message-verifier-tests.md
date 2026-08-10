---
title: "port-activesupport-message-verifier-tests"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5970
claim: "2026-08-03T13:59:39Z"
assignee: "port-activesupport-message-verifier-tests"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/message-verifier.test.ts` is 11 bodyless `it.skip`
placeholders — `parity:test` reports `message_verifier_test.rb` at 0/11 with
11 skipped, even though `MessageVerifier` itself is fully ported
(`packages/activesupport/src/message-verifier.ts`, `parity:api`
`message_verifier.rb` 11/15).

Rails tests to port —
`vendor/rails/activesupport/test/message_verifier_test.rb`:

- `valid message`
- `simple round tripping`
- `round tripping nil`
- `verified returns false on invalid message`
- `verify exception on invalid message`
- `supports URL-safe encoding`
- `URL-safe and URL-unsafe can decode each other messages`
- `alternative serialization method`
- `verify with parse json times`
- `raise error when secret is nil`
- `inspect does not show secrets`

Nothing new needs porting for most of these; they exercise the existing
`generate` / `verify` / `verified` / `valid_message?` surface. Two may surface
real gaps: `raise error when secret is nil` (trails' constructor does not
validate the secret) and `inspect does not show secrets` (no `inspect`
analogue — check what `SKIP_GROUPS` or a JS-side equivalent should be before
inventing one).

Two related deviation stories already exist and should not be duplicated here:
`message-verifier-empty-string-purpose-truthy-gate` and
`message-verifier-separator-index-extraction`.

## Acceptance criteria

- The 11 placeholders replaced with real tests, names matching Rails verbatim.
- Any implementation gap the tests expose is fixed in
  `message-verifier.ts` rather than worked around in the test.
- `pnpm typecheck` and `pnpm lint` pass.
