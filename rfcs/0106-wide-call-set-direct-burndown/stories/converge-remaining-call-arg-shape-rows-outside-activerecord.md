---
title: "converge-remaining-call-arg-shape-rows-outside-activerecord"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6688
claim: "2026-08-18T12:16:46Z"
assignee: "converge-remaining-call-arg-shape-rows-outside-activerecord"
blocked-by: null
closed-reason: null
---

# Converge the remaining non-receiver call-argument shape rows outside ActiveRecord

## Context

`converge-surfaced-call-arg-shape-rows` (RFC 0108) listed 28 genuine
per-body call-ARGUMENT divergences surfaced by the owner-scoped gate fix. PR
for that story converged the five ActiveRecord-package rows and deleted their
baseline rows:

- `activerecord/aggregations.ts` — `writerMethod` parameter order now
  `(name, className, mapping, allowNil, converter)` (`aggregations.rb:225`).
- `activerecord/associations/through-association.ts` — `ensureNotNested` now
  raises `Has{One,Many}ThroughNestedAssociationsAreReadonly.new(owner, reflection)`
  (`through_association.rb:104-112`), and the error class derives Rails'
  message from the pair (`associations/errors.rb:224-238`).
- `activerecord/connection-adapters/sqlite3/schema-statements.ts` — `type:` is
  a kwarg on `dataSourceSql` / `quotedScope` (`sqlite3/schema_statements.rb:87,181`).
- `activerecord/encryption/encryptor.ts` — `buildEncryptedMessage(clearText,
{ keyProvider, cipherOptions })` (`encryptor.rb:49`).

The rest were left in the baseline, split by package. Each row's `reason`
field in `scripts/api-compare/call-mismatches-exclude/` names the Rails
`file:line` and the exact divergence, so no re-derivation is needed:

- `actioncontroller/metal/implicit-render.ts` (3), `basic-implicit-render.ts`
  (`head :no_content` ported as `head(204)`),
  `etag-with-template-digest.ts`, `request-forgery-protection.ts`.
- `actiondispatch/http/mime-negotiation.ts` (2),
  `middleware/static.ts`, `middleware/host-authorization.ts`.
- `actionview/helpers/javascript-helper.ts`.
- `activesupport/core-ext/digest/uuid.ts` (2),
  `core-ext/date-time/calculations.ts` (3), `time-ext.ts` (2),
  `duration.ts`, `transliterate.ts`, `cache/coder.ts`,
  `testing/deprecation.ts`.
- `rack/multipart/parser.ts`, `i18n/interpolate/ruby.ts`.

Note two of these look unconvergeable as spelled and need a judgement call
rather than a mechanical fix, so decide them explicitly rather than leaving
them silently:

- `activesupport/transliterate.ts` — Rails calls
  `transliterate(string, locale: locale)`, skipping the middle positional
  `replacement` default; TypeScript cannot omit a middle positional, so
  passing `undefined` swaps one shape divergence for another.
- `activesupport/cache/coder.ts` — `Float::INFINITY` vs JS `Infinity` is the
  same value under the only spelling JS has.

## Acceptance criteria

- [ ] Each ported body passes what Rails passes at the cited call, and its
      baseline row is DELETED by hand from its `call-mismatches-exclude`
      shard (only-shrink; no reseed).
- [ ] Split by package across PRs — each from `main`, non-overlapping files.
- [ ] For the two rows above: converge if a faithful spelling exists,
      otherwise leave the row with a reason that names the TypeScript
      shortcoming precisely.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.

_Moved from RFC 0108 on 2026-08-18. 0108's charter is call-gate **false
positives** — the tool reporting a mismatch where the port is faithful — and its
stop rule routes port convergence to this RFC. These rows are the opposite case:
real ports passing something other than what Rails passes, which a 0108 tooling
fix stopped hiding. `converge-accessor-surfaced-call-set-rows` (already here) is
the same shape and set the precedent._
