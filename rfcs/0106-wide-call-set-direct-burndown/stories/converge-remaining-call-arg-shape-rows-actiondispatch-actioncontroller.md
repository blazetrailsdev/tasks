---
title: "Converge the remaining call-argument shape rows in actiondispatch and actioncontroller"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6697
claim: "2026-08-18T13:26:57Z"
assignee: "converge-remaining-call-arg-shape-rows-actiondispatch-actioncontroller"
blocked-by: null
closed-reason: null
---

## Context

RFC 0106's non-ActiveRecord call-ARGUMENT shape burndown ran in two PRs —
`converge-remaining-call-arg-shape-rows-outside-activerecord` (ActionPack/
ActionView) and `converge-remaining-call-arg-shape-rows-activesupport-rack-i18n`
(#6691, activesupport/rack/i18n). The actiondispatch/actioncontroller rows named
in the latter's context were left to a per-package PR and no story owns them yet.

Still baselined in `scripts/api-compare/call-mismatches-exclude/`:

- `actiondispatch/http/mime-negotiation.ts` — 3 `set_header` rows plus 1 `new`
  row. Rails forwards the `(k, v)` pair (`http/mime_negotiation.rb`, the
  `set_header(k, v)` sites behind `content_mime_type`, `accepts`, `formats`);
  the port names the header CONSTANT (`CONTENT_TYPE_KEY`, `ACCEPTS_KEY`,
  `FORMATS_KEY`) and the computed value directly. Converged shape: keep Rails'
  `k` / `v` locals and pass them.
- `actiondispatch/middleware/host-authorization.ts` — `mark_as_authorized(request)`.
  `host_authorization.rb:167-168` sets the header through `request.set_header`;
  the port threads the raw Rack env because trails' `Request` constructor CLONES
  `env` (`actiondispatch/src/http/request.ts:157`), so a header written through
  the Request would not be visible downstream. Converging this row means first
  deciding whether that clone is itself the divergence to fix.
- `actioncontroller/metal/request-forgery-protection.ts` — ~10 rows, all carrying
  a leading receiver parameter `c` that `isReceiverParam` (`scripts/api-compare/arity.ts:147`)
  does not recognise under that name, so they are largely gate residue (RFC 0108)
  rather than port debt. Per row, either teach the extractor the receiver
  spelling or convert the module to `this`-typed functions per CLAUDE.md's
  module-mixin idiom. #6691 did exactly this for `activesupport/time-ext.ts`
  (added the `RubyTime` receiver type, renamed the receiver param to match its
  callees) and it converged two rows with no behavioural change — same play here.

Two rows reviewed and deliberately LEFT, do not re-open: `activesupport/transliterate.ts`
(TS cannot omit a middle positional argument) and `activesupport/cache/coder.ts`
(`Float::INFINITY` vs JS `Infinity`).

## Acceptance criteria

- [ ] Each body passes what Rails passes at the cited call, and its baseline row
      is DELETED by hand from its `call-mismatches-exclude` shard (only-shrink,
      no reseed; `parity:api:calls:tighten` for a stale mark).
- [ ] Rows that are extractor residue are fixed in the extractor (with an
      `arity.test.ts` / `call-args.test.ts` pin), not baselined.
- [ ] A row that genuinely cannot converge keeps a reason naming the specific
      TypeScript shortcoming, never a restated seed string.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
