---
title: "activesupport-log-subscriber-level-helpers-block-in-progname-slot"
status: closed
updated: 2026-11-19
rfc: "0246-activesupport-parity-100"
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
closed-reason: "FALSIFIED: the five actionview log-subscriber call-args rows appeared only in a package-scoped parity:changed run; the unscoped parity:api:calls:args run does not flag them, so trails#10353 deleted the baseline."
---

## Context

`ActiveSupport::LogSubscriber`'s level helpers are
`def #{level}(progname = nil, &block)`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/log_subscriber.rb:161-167`),
so `ActionView::LogSubscriber` writes `info do ... end` / `debug do ... end`
(`vendor/rails/v8.0.2/actionview/lib/action_view/log_subscriber.rb:17-75`).
The port's `packages/actionview/lib/log-subscriber.ts` calls
`this.info(undefined, () => ...)`, which `parity:api:calls:args` reports for
`render_template`, `render_partial`, `render_layout` and `render_collection`
(baselined in `scripts/api-compare/call-mismatches-exclude/actionview/log-subscriber.json`).

The block and `progname` can be told apart by type, so per root CLAUDE.md
("An optional positional before trailing options or a block") the helpers in
`packages/activesupport/lib/log-subscriber.ts` may take the block in the
`progname` slot. Doing so widens the parameter type, which breaks
`packages/activestorage/lib/log-subscriber.ts`'s `info` / `debug` overrides
(TS2416; Rails' `def info(event, colored_message)`,
`activestorage/lib/active_storage/log_subscriber.rb`); those overrides need
reconciling in the same PR.

## Acceptance criteria

- [ ] `LogSubscriber#info`/`debug`/`warn`/`error`/`fatal`/`unknown` accept the
      block in the `progname` slot.
- [ ] actionview's four call sites pass only the block; activestorage's
      overrides typecheck.
- [ ] The four baseline rows are deleted.
