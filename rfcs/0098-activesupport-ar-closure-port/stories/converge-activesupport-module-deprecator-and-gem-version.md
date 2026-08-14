---
title: "converge-activesupport-module-deprecator-and-gem-version"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6547
claim: "2026-08-14T21:41:01Z"
assignee: "converge-activesupport-module-deprecator-and-gem-version"
blocked-by: null
closed-reason: null
---

## Context

Left over from `logging-internals-broadcast-logger-and-silencer` (RFC 0098). That
story closed the logging half of slot G — `broadcast_logger.rb`, `logger.rb`,
`logger_silence.rb` and `logger_thread_safe_level.rb` are all at 0 missing — and
ported the private `with_execution_control` / `execute_hook` pair of
`lazy_load_hooks.rb` into `packages/activesupport/src/lazy-load-hooks.ts`, which
took the `deprecator.rb` bucket from 10/14 to 12/14.

`pnpm parity:api --package activesupport --missing` still reports 2 missing on
`deprecator.rb → deprecator.ts` (the bucket that holds the `ActiveSupport`
module's own singleton methods):

- `deprecator` → `deprecator`
  (`vendor/rails/activesupport/lib/active_support/deprecator.rb:4` —
  `def self.deprecator; ActiveSupport::Deprecation._instance; end`).
  trails already exports `deprecator` from
  `packages/activesupport/src/deprecation.ts:468`, but as
  `export const deprecator = new Deprecation()` — a _value_, not the
  `_instance()` call, and not in a `deprecator.ts`. `Deprecation._instance()`
  exists at `deprecation.ts:199`. Converging means flipping the const to a
  function (or to `Deprecation._instance()`) and checking the ~call sites that
  use it as a value.
- `gem_version` → `gemVersion`
  (`vendor/rails/activesupport/lib/active_support/gem_version.rb:5` —
  `Gem::Version.new VERSION::STRING`, with `module VERSION` alongside it).
  trails has no version constant at all, so this needs a `gem-version.ts`
  carrying `VERSION` and a `Gem::Version`-shaped return.

Both were left out of the parent PR: the first is a cross-package API flip and
the second invents a new file, neither of which fit under that PR's LOC ceiling
next to the logging port.

## Acceptance criteria

- `deprecator.rb` reports 0 missing in `pnpm parity:api --package activesupport`.
- `deprecator` resolves through `Deprecation._instance()` as Rails does, with
  every existing call site updated (no second Deprecation instance left behind).
- Deltas non-negative on `pnpm parity:api` / `pnpm parity:test`.
