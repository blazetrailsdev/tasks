---
title: "logging-internals-broadcast-logger-and-silencer"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6526
claim: "2026-08-14T15:07:01Z"
assignee: "logging-internals-broadcast-logger-and-silencer"
blocked-by: null
closed-reason: null
---

## Context

Split out of `deprecation-and-logging-internals` (RFC 0098, slot G): that story
bundled deprecation + logging internals, and the deprecation half landed in the
same PR that files this one (`deprecation.rb`, `deprecation/reporting.rb`,
`deprecation/disallowed.rb` and `deprecation/method_wrappers.rb` are all at 0
missing now). The logging half did not fit under the PR LOC ceiling.

Remaining, as `pnpm parity:api --package activesupport --missing` reports:

- `broadcast_logger.rb` → `broadcast-logger.ts`, 10 missing of 38:
  `sev_threshold=`, `debug!`, `info!`, `warn!`, `error!`, `fatal!`, `dispatch`,
  `silencer`, `silencer=`, `local_level_key`.
  (`vendor/rails/activesupport/lib/active_support/broadcast_logger.rb`)
- `logger.rb` → `logger.ts`, 5 missing of 11: `silencer`, `silencer=`,
  `local_level_key`, `logger_outputs_to?`, `normalize_sources`.
- `logger_silence.rb`, 5 missing: `silencer`, `silencer=`, `local_level_key`,
  `append_features`, `prepend_features`.
- `logger_thread_safe_level.rb`, 3 missing: `local_level_key`,
  `append_features`, `prepend_features`.
- `deprecator.rb` → `deprecator.ts`, 4 missing: `deprecator`, `gem_version`,
  `with_execution_control`, `execute_hook`.

`append_features` / `prepend_features` are Ruby module-inclusion hooks with no
TS equivalent — they belong in a `SKIP_GROUPS` entry (with a reason) in
`scripts/parity/conventions.ts`, not in a port. Thread-local level plumbing
(`local_level_key`) likewise has no JS analogue; skip it with a reason rather
than inventing machinery.

## Acceptance criteria

- The listed files report 0 missing in `pnpm parity:api --package activesupport`,
  or carry reasoned SKIP rows for the genuinely non-portable members.
- Deltas non-negative on `pnpm parity:api` / `pnpm parity:test`.
- Tests mirror the corresponding Rails cases
  (`vendor/rails/activesupport/test/broadcast_logger_test.rb`,
  `logger_test.rb`) for the added members, with Rails' test names verbatim.
