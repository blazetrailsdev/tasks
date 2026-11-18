---
title: "Deprecation log behavior reads ActiveSupport::Logger through a namespace seat instead of an import"
status: draft
updated: 2026-11-18
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Deprecation::Behavior`'s `log` behavior (`vendor/rails/v8.0.2/activesupport/lib/active_support/deprecation/behaviors.rb:24-34`) does `require "active_support/logger"` (`:30`) and then `ActiveSupport::Logger.new($stderr)` (`:31`).

trails#10284 made `LoggerSilence`'s `included` hook call `cattrAccessor` (`logger_silence.rb:12`), so `packages/activesupport/lib/logger-silence.ts` imports `module-ext.ts`. `module-ext` reaches `deprecation.ts` both directly (`callerLocations`) and through `hash-utils` → `xml-mini` → `duration` → `core-ext/time/calculations` → `deprecator`. Nearly every activesupport module reaches `deprecator`.

A plain `import { Logger }` in `deprecation.ts` closed that cycle, and the import-cycles gate flagged `include(Logger, LoggerSilence)`. Entering at `logger-silence.js` threw a TDZ error. So `deprecation.ts:40` now reads `new ActiveSupport.Logger(stderr)` through a namespace seat that `logger.ts` sets. The operator ruled to keep the seat (trails#10284).

Gap: a program that imports only `@blazetrails/activesupport/deprecation` and logs with the `log` behavior gets `TypeError: ActiveSupport.Logger is not a constructor`, because nothing has evaluated `logger.ts`. Tried in #10284 without success:

- cutting `core-ext/object/blank.ts` → `time-with-zone.ts`. `TimeWithZone#blank?` is its own method (`time_with_zone.rb:515-517`), so this cut is safe on its own, but another path remains.
- moving `callerLocations` into ruby-compat's `backtrace-location.ts`

## Converged shape

`deprecation.ts` imports `Logger` with a plain ES import (CLAUDE.md § "Call-time constant resolution": a call-time read is an import). The cycle is broken where it is invented: `module-ext.ts`, the `mattr_accessor` / `delegate` port, does not reach `deprecation.ts` or the time and duration graph at module-eval time.

## Acceptance criteria

- `deprecation.ts` has `import { Logger } from "./logger.js"` and `new Logger(stderr)`. The `ActiveSupport.Logger` seat is removed.
- `pnpm tsx scripts/parity/import-cycles.ts` passes.
- A plain-node import of each built entry succeeds: `dist/logger-silence.js`, `module-ext.js`, `logger.js`, `broadcast-logger.js`, `deprecation.js`, `index.js`. Importing only `deprecation` and logging with the `log` behavior writes the warning.
