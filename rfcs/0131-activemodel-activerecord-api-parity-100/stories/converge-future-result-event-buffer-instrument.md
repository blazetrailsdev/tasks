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
blocked-by: "Cannot converge without first unifying ActiveSupport::Notifications::Instrumenter#instrument with its trails async twin, which is a repo-wide activesupport change of its own size. EventBuffer#instrument (future_result.rb:33-40) is duck-typed against AdapterInstrumenter (abstract-adapter.ts:29-35, called at :2019), whose other implementation is Notifications.instrumenter — an Instrumenter that already carries Rails' SYNC instrument (instrumenter.rb:54-65) at that name, so the contract member cannot simply be renamed to instrument. Renaming only EventBuffer's member breaks the contract; adding instrument beside instrumentAsync is the synonym the story forbids. The one shape that closes it is a single non-async Instrumenter#instrument returning T | Promise<T> that finishes the handle in a then/finally for a thenable block (the settled trails idiom for a Ruby method whose one body must cover both), after which EventBuffer takes the Rails name and the contract follows. That touches instrumenter.ts, notifications.ts, abstract-adapter.ts and 4 test files and gates every sql.active_record event in the repo, so it needs its own PR."
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
