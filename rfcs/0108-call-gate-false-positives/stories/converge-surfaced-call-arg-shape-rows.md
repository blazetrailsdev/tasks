---
title: "converge-surfaced-call-arg-shape-rows"
status: done
updated: 2026-08-18
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6699
claim: "2026-08-18T13:46:52Z"
assignee: "converge-remaining-call-arg-shape-rows"
blocked-by: null
closed-reason: null
---

# Converge the 28 non-receiver call-argument rows the owner-scoped gate surfaced

## Context

The call-argument gate fix in `call-args-gate-skips-twice-declared-bodies`
(PR TBD) surfaced 93 pre-existing `kind: "args"` shape rows. 65 are the
receiver-threading class covered by
`converge-date-time-receiver-threaded-call-args`; the remaining 28 are genuine
per-body argument divergences, each baselined with its own reason in
`scripts/api-compare/call-mismatches-exclude/`. They are real ports passing
something other than what Rails passes, and each is a small independent fix:

- `activerecord/aggregations.ts` — `aggregations.rb:225` passes
  `(name, class_name, mapping, allow_nil, converter)`; the ported `writerMethod`
  declares `(name, mapping, className, converter, allowNil)`. Parameter ORDER.
- `activerecord/associations/through-association.ts` —
  `through_association.rb:106` raises
  `HasManyThroughNestedAssociationsAreReadonly.new(owner, reflection)`; the port
  passes a rendered message.
- `activerecord/connection-adapters/sqlite3/schema-statements.ts` (2) —
  `sqlite3/schema_statements.rb:87,181` pass `type:` as a kwarg; the port takes
  it positionally.
- `activerecord/encryption/encryptor.ts` — `encryptor.rb:49` passes
  `(clear_text, key_provider:, cipher_options:)`; the port passes
  `(text, keyProvider, { deterministic })`.
- `activesupport/core-ext/digest/uuid.ts` (2) — `digest/uuid.rb:42,47` name
  `::Digest::MD5` / `::Digest::SHA1`; the port passes `"md5"` / `"sha1"`.
- `activesupport/core-ext/date-time/calculations.ts` (3) — the
  `usec: Rational(999999999, 1000)` kwarg value
  (`date_time/calculations.rb:140,152,164`).
- `activesupport/time-ext.ts` (2) — `time/calculations.rb:123-155`'s
  `::Time.local(…, nil, nil, isdst, nil)` tail and the `::Time.new` arm.
- `activesupport/duration.ts`, `activesupport/transliterate.ts`,
  `activesupport/cache/coder.ts`, `activesupport/testing/deprecation.ts` (1 each).
- `actioncontroller/metal/implicit-render.ts` (3) — `implicit_render.rb:38,40,57`
  pass `(action_name.to_s, _prefixes[, variants:])`; the port passes the action
  name alone.
- `actioncontroller/metal/basic-implicit-render.ts` — `head :no_content` ported
  as `head(204)`.
- `actioncontroller/metal/etag-with-template-digest.ts`,
  `actioncontroller/metal/request-forgery-protection.ts`,
  `actionview/helpers/javascript-helper.ts`,
  `actiondispatch/http/mime-negotiation.ts` (2),
  `actiondispatch/middleware/static.ts`,
  `actiondispatch/middleware/host-authorization.ts`,
  `activerecord/reflection.ts`, `activerecord/relation.ts` (2),
  `activerecord/test-databases.ts`, `rack/multipart/parser.ts`,
  `i18n/interpolate/ruby.ts` (1 each).

Each row's `reason` field names the Rails `file:line` and states the exact
divergence, so no re-derivation is needed.

## Acceptance criteria

- [ ] Each ported body passes what Rails passes at the cited call, and its
      baseline row is DELETED by hand from its `call-mismatches-exclude` shard
      (only-shrink; no reseed).
- [ ] Split across PRs by package if the whole set exceeds the LOC ceiling —
      each PR from `main`, non-overlapping files.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
