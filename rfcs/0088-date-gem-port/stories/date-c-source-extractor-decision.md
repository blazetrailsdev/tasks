---
title: "date-c-source-extractor-decision"
status: done
updated: 2026-08-05
rfc: "0088-date-gem-port"
cluster: null
deps: ["vendor-ruby-date-gem"]
deps-rfc: []
est-loc: 80
pr: 6138
claim: "2026-08-05T17:13:08Z"
assignee: "date-yday-drops-m-yday-fast-arms"
blocked-by: null
closed-reason: null
---

## Context

**Spike. Gates `date-api-compare-enrollment`.** This is the highest-risk
assumption in the RFC and it is deliberately settled before any code moves.

`scripts/api-compare/extract-ruby-api.rb` parses **Ruby**, not C. But the bulk of
what `packages/i18n/src/date.ts` ports lives in `ext/date/date_parse.c` and
`ext/date/date_core.c`; `lib/date.rb` in the gem is comparatively thin. So it is
not yet known whether `parity:api` can credit the ported surface at all once
`vendor/date/` exists.

The RFC's stated fallback: enroll `lib/date.rb` + `test/date/` in the normal
machinery and treat the C sources as a vendored **read-anchor** — present and
citable, excluded from the compared population via `UNPORTED_FILES` `pattern`
entries with reasons (`scripts/api-compare/unported-files.ts:1-50` documents the
`pattern` / `testFile` / `package` fields).

**That fallback still fixes the presenting problem.** `parity:test` over
`test/date/` gives the cluster a real, shrinking, self-terminating gate — which
is exactly what it lacks today — without a C-parser project.

## Acceptance criteria

- [ ] Run `pnpm parity:api` with the `date` source enrolled and record what
      `lib/date.rb` alone credits.
- [ ] Decide and **write up in the RFC README** one of: (a) `lib/date.rb` credits
      enough surface to enroll normally; (b) C sources need `UNPORTED_FILES`
      `pattern` entries with reasons; (c) a C extractor is required — in which
      case **file it as its own story and `pnpm tasks block` the enrollment
      story**, rather than expanding this one.
- [ ] If (b), the `UNPORTED_FILES` entries land here with real reasons — not a
      seeded placeholder.
- [ ] Findings recorded even if the answer is (a) — the next agent must not have
      to re-derive this.
- [ ] No package scaffold, no file moves.
