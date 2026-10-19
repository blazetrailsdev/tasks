---
title: "rack-index-body-helpers-and-handler-extra-surface"
status: closed
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: work folded into trails#9086 (ceiling waived by owner)"
---

## Context

`rack-extra-surface-outside-headers-to-zero` burnt rack's extra surface down to
3 novel / 3 total and enrolled `rack` in `COUNTED_PACKAGES` of
`scripts/api-compare/extra-surface-mark.ts` with a `{ novel: 3, total: 3 }` row.
The three left are all in `packages/rack/src/index.ts`, a file with no Rack
counterpart:

- `bodyFromString(str)` — an async generator wrapping a string. Rack bodies are
  Arrays (`[body]`, e.g. `vendor/rack/v3.1.14/lib/rack/response.rb:24-26`), so
  every call is `[str]`. ~114 call sites across actionpack, trailties, website,
  rack-session, rack-test (mostly tests; production in
  `action-dispatch/middleware/{ssl,actionable-exceptions,show-exceptions,debug-exceptions,host-authorization,debug-locks}.ts`).
- `bodyToString(body)` — drains a body to a string; ~52 call sites, mostly tests.
  Rails tests read `response.body` / `body.join`.
- `Handler` — `export * as Handler from "./handler/index.js"`. Rack 3 moved
  handlers to the rackup gem (`Rackup::Handler`), which is not vendored; the
  Node handler (`handler/node.ts`) is already receipted `PERMANENT`.

## Acceptance criteria

- [ ] `bodyFromString` / `bodyToString` deleted; callers converge on Array bodies
      and the Rails reads.
- [ ] `Handler` is either reached at a Rails/rackup-mirrored path or carries a
      receipt the repo owner rules on.
- [ ] `parity:api:extra --package rack` reports 0 novel / 0 moved; `rack` moves
      from `COUNTED_PACKAGES` to `ROWLESS_PACKAGES` and its mark row is removed.
