---
title: "deprecation-and-logging-internals"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6456
claim: "2026-08-13T03:36:51Z"
assignee: "call-args-ar-predicate-builder-set-handler"
blocked-by: null
closed-reason: null
---

## Context

Slot G: deprecation + logging internals (~35 members, audit slot ~250 LOC). AR raises deprecations and logs through these.

- `deprecation.rb` — 10 remaining of 32: `deprecation_warning`, `deprecated_method_warning`, `deprecation_message`, `deprecation_caller_message`, `extract_callstack`, `ignored_callstack?`, `deprecation_disallowed?`, `explicitly_allowed?`, `deprecate_methods`, `_instance`.
- `deprecator.rb` — NO TS FILE for 4 of 14 (file partially exists via other mapping — verify with parity:api output).
- `deprecation/reporting.rb` 6, `deprecation/disallowed.rb` 2 (in closure via `deprecation` require).
- `broadcast_logger.rb` — 10 remaining of 38: `sev_threshold=`, `debug!`/`info!`/`warn!`/`error!`/`fatal!`, `dispatch`, `silencer`(=), `local_level_key`.
- `logger.rb` — 5 remaining of 11; `logger_silence.rb` 5 and `logger_thread_safe_level.rb` 3 as far as AR's log_subscriber path needs them.

Rails sources under `vendor/rails/activesupport/lib/active_support/`. Thread-local level plumbing that has no JS equivalent goes to SKIP_GROUPS with a reason.

## Acceptance criteria

- Listed files at 0 missing or reasoned SKIP rows; delta non-negative.
- Deprecation message strings byte-match Rails (same error class, same message, same raise site).
