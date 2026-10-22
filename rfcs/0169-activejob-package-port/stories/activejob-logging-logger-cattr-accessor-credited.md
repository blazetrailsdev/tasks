---
title: "activejob logging: credit the included-block logger cattr_accessor"
status: in-progress
updated: 2026-10-22
rfc: "0169-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9241
claim: "2026-10-22T18:46:56Z"
assignee: "activejob-logging-logger-cattr-accessor-credited"
blocked-by: null
closed-reason: null
---

## Context

`parity:api --package activejob` reports 367/369. Its only misses are
`logging.rb`'s `logger` / `logger=` (→ `setLogger`), from
`cattr_accessor :logger, default: ActiveSupport::TaggedLogging.new(...)` in
`included do` (`vendor/rails/v8.0.2/activejob/lib/active_job/logging.rb:15`).

The accessor **is** ported: `packages/activejob/src/logging.ts:62-65` calls
`cattrAccessor.call(this, "logger", { default: ... })`. But the block is hung as
`Concern.included.call(Logging as never, null, function () { ... })`, and
`includedHookOwner` (`scripts/api-compare/extract-ts-api.ts:3831-3846`) only
recognises `X.included(null, fn)` / `X[included] = fn`. It reads the owner as
`Concern`, not `Logging`, so the seated accessor is never credited. Five other
files use the same `Concern.included.call` spelling
(`grep -rln 'Concern.included.call' packages/*/src`), so their `included do`
definers have the same gap.

## Acceptance criteria

- [ ] `logging.ts`'s `included do` block is spelled in the shape the extractor
      credits (`Logging.included(null, fn)`), or the extractor learns
      `Concern.included.call(X, null, fn)`. Prefer converging the source if
      `Logging` answers `included` after `extend(Logging, Concern)`.
- [ ] `pnpm parity:api --package activejob` reports `logging.rb` 10/10 (369/369).
- [ ] The other `Concern.included.call` sites are checked, and any newly credited
      members don't raise the extra-surface or call gates.
