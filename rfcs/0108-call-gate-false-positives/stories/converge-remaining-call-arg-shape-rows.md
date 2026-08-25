---
title: "converge-remaining-call-arg-shape-rows"
status: done
updated: 2026-08-18
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6699
claim: "2026-08-18T13:46:52Z"
assignee: "converge-remaining-call-arg-shape-rows"
blocked-by: null
closed-reason: null
---

# Converge the remaining surfaced call-argument shape rows

## Context

Split out of `0108-call-gate-false-positives/converge-surfaced-call-arg-shape-rows`.
PR #TBD converged four of the 28 rows that story enumerates — the actioncontroller
`implicit_render` / `basic_implicit_render` trio and actionview's
`javascript_tag` — plus the `Session::Options` row from
`0106-wide-call-set-direct-burndown/port-request-session-options-instance`.
The rest are still baselined as `kind: "args"` shape rows under
`scripts/api-compare/call-mismatches-exclude/`.

Re-derived from `scripts/api-compare/output/call-arg-mismatches.json` (each
row's `reason` already names the Rails `file:line`):

- `actiondispatch/middleware/static.ts` (4) — `middleware/static.rb:21` builds
  `::Rack::Files.new(path, headers:, index:)` and `:38,:50,:60` thread
  `accept_encoding:` as a KWARG; the port passes it positionally.
- `actiondispatch/http/mime-negotiation.ts` (3) — `mime_negotiation.rb:41,56,67`
  read through `fetch_header(KEY) { |k| … set_header k, v }`; the ports of
  `content_mime_type` and `accepts` hand-roll the cache and name the constant.
  The `formats` row is comparator pairing against the `formats=` SETTER —
  verify before converging.
- `actiondispatch/middleware/host-authorization.ts` — `host_authorization.rb:167`
  is `mark_as_authorized(request)` writing `request.set_header(…, request.host)`;
  the port threads `env` separately BECAUSE trails' `Request` clones its env
  (`middleware/host-authorization.ts:250`), so converging this row needs the
  by-reference env first. Likely blocked on that.
- `actioncontroller/metal/etag-with-template-digest.ts` and
  `actioncontroller/metal/request-forgery-protection.ts` — receiver-threaded free
  functions; converging needs the `this`-typed function idiom
  (`NullSessionHash.new(request)` / `NullCookieJar.build` are not ported).
- `activesupport/core-ext/digest/uuid.ts` (2), `activesupport/duration.ts`,
  `activesupport/transliterate.ts`, `activesupport/cache/coder.ts`,
  `activesupport/testing/deprecation.ts`,
  `activesupport/core-ext/date-time/calculations.ts` (3).
- `activerecord/aggregations.ts` (parameter ORDER on `writerMethod`),
  `activerecord/associations/through-association.ts`,
  `activerecord/connection-adapters/sqlite3/schema-statements.ts` (2),
  `activerecord/encryption/encryptor.ts`, `activerecord/reflection.ts`,
  `activerecord/relation.ts` (2), `activerecord/test-databases.ts`.
- `rack/multipart/parser.ts`, `i18n/interpolate/ruby.ts`.

Several are receiver-as-first-argument rows that overlap
`converge-date-time-receiver-threaded-call-args`; check that story before
touching `relation.ts`, `reflection.ts`, `test-databases.ts` and `time-ext.ts`.

## Acceptance criteria

- [ ] Each ported body passes what Rails passes at the cited call, and its
      baseline row is DELETED by hand from its `call-mismatches-exclude` shard
      (only-shrink; no reseed).
- [ ] A row that genuinely cannot converge (a language shortcoming, or blocked
      on the `Request` env-clone divergence) gets a reviewed one-line `reason`
      naming the blocker, not a broadened seed string.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
