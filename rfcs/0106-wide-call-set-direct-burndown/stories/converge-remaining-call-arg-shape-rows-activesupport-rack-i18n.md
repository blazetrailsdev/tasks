---
title: "converge-remaining-call-arg-shape-rows-activesupport-rack-i18n"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6691
claim: "2026-08-18T12:36:57Z"
assignee: "converge-remaining-call-arg-shape-rows-activesupport-rack-i18n"
blocked-by: null
closed-reason: null
---

# Converge the remaining call-argument shape rows in activesupport, rack and i18n

## Context

`converge-remaining-call-arg-shape-rows-outside-activerecord` shipped the
ActionPack/ActionView half of RFC 0106's non-ActiveRecord call-ARGUMENT shape
burndown (PR: implicit-render x3, basic-implicit-render, etag-with-template-digest,
javascript-helper, middleware/static x4 — plus the now-converged
`default_render -> variant` call-set row). The single-PR ceiling stopped it
there. The rows below are still baselined in
`scripts/api-compare/call-mismatches-exclude/`, each with a `reason` naming the
Rails `file:line` and the exact divergence, so no re-derivation is needed:

- `actiondispatch/http/mime-negotiation.ts` (3 `set_header` rows + 1 `new`
  row) — Rails forwards the `(k, v)` pair; the port names the header constant
  and the computed value directly.
- `actiondispatch/middleware/host-authorization.ts` — `mark_as_authorized(request)`
  (`host_authorization.rb:167-168` sets the header through `request.set_header`);
  the port threads the raw Rack env because trails' `Request` constructor
  CLONES `env` (`http/request.ts:157`), so a header written through the Request
  would not be visible downstream. Converging this row means deciding whether
  the clone is itself the divergence to fix.
- `actioncontroller/metal/request-forgery-protection.ts` — the whole file uses
  a leading receiver parameter `c`, which `isReceiverParam` does not recognize
  under that name, so its rows are largely gate residue (RFC 0108) rather than
  port debt. Decide per row: teach the extractor the receiver spelling, or
  rename/convert the module to `this`-typed functions.
- `activesupport/core-ext/digest/uuid.ts` (2), `core-ext/date-time/calculations.ts`
  (3), `time-ext.ts` (2), `duration.ts`, `testing/deprecation.ts`.
- `rack/multipart/parser.ts` (2), `i18n/interpolate/ruby.ts`.

Two rows were reviewed by the parent story and deliberately LEFT with a
precise TypeScript-shortcoming reason — do not re-open them:

- `activesupport/transliterate.ts` — TS cannot omit a middle positional
  argument, so no spelling reproduces Rails' 2-argument
  `transliterate(string, locale: locale)`.
- `activesupport/cache/coder.ts` — `Float::INFINITY` vs JS `Infinity` is the
  same value under the only spelling JS has.

## Acceptance criteria

- [ ] Each remaining body passes what Rails passes at the cited call, and its
      baseline row is DELETED by hand from its `call-mismatches-exclude` shard
      (only-shrink; no reseed; `parity:api:calls:tighten` for any stale mark).
- [ ] Split by package across PRs — each from `main`, non-overlapping files.
- [ ] A row that genuinely cannot converge keeps a reason naming the specific
      TypeScript shortcoming, never a restated seed string.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
