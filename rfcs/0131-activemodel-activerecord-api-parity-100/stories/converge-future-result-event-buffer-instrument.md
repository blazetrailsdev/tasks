---
title: "converge-future-result-event-buffer-instrument"
status: blocked
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: "2026-09-03T15:51:19Z"
assignee: "converge-future-result-event-buffer-instrument"
blocked-by: "Gated on unify-instrumenter-instrument-sync-and-async-arms (now ready, priority 5), which is the prerequisite this reason previously described inline. Verified live on origin/main 2026-09-03: Instrumenter still splits instrument/instrumentAsync (activesupport/src/notifications/instrumenter.ts:244) and the AdapterInstrumenter contract still names instrumentAsync (activerecord/src/connection-adapters/abstract-adapter.ts:29-35), so EventBuffer still cannot take the Rails name. Unblock once that story lands."
closed-reason: null
---

## Context

`FutureResult::EventBuffer#instrument`
(`vendor/rails/activerecord/lib/active_record/future_result.rb:33-40`) is
spelled `instrumentAsync` at
`packages/activerecord/src/future-result.ts:82`, which is why
`future_result.rb` sits at 15/16 rather than 16/16.

The rename is not local. `instrumentAsync` is the repo-wide async twin of
`ActiveSupport::Notifications.instrument`
(`packages/activesupport/src/notifications.ts:256`), and `EventBuffer` is
duck-typed against the `AdapterInstrumenter` contract
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:29-35`,
called at `:2014`) alongside `Notifications.instrumenter`. Renaming only
`EventBuffer`'s member breaks that contract; adding `instrument` beside
`instrumentAsync` is an invented synonym. Converging it means deciding whether
`instrumentAsync` keeps the Rails name `instrument` repo-wide — a decision
`converge-activerecord-single-method-files` deliberately did not take
(the other six rows in that story shipped; this one was dropped per its own
"if any one turns out to need real design, drop it and file it").

## Acceptance criteria

- `future_result.rb` reaches 16/16 with `EventBuffer#instrument` a real body at
  the Rails name, without adding a synonym beside `instrumentAsync`.
- Whatever is decided for `instrumentAsync` is applied consistently to
  `Notifications` and the `AdapterInstrumenter` contract, not just to
  `EventBuffer`.
- `pnpm parity:api:calls`, `:calls:args` and `:params` clean.
