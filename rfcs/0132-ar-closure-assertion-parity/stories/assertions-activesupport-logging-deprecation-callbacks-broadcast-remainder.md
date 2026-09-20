---
title: "assertions-activesupport-logging-deprecation-callbacks-broadcast-remainder"
status: closed
updated: 2026-09-19
rfc: "0132-ar-closure-assertion-parity"
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
closed-reason: "Split, not dropped. Its body claimed ten activesupport files totalling 279 mismatches (re-measured 2026-09-19: deprecation 29/61/2, test_case 31/36/3, callbacks 16/26/1, broadcast_logger 7/31/0, logger 11/14/1, tagged_logging 8/9/3, error_reporter 2/3/0, rescuable 2/4/3, clean_logger 1/1/1, notifications 0/2/0), over this RFC's ~250-mismatch split threshold. Replaced along file boundaries by assertions-activesupport-deprecation-and-test-case, assertions-activesupport-loggers-cluster and assertions-activesupport-notifications-residue, which carry its measurements and its Fanout/setupTestCase context forward."
---

## Context

Remainder of `assertions-activesupport-logging-deprecation-callbacks-broadcast` (RFC 0132) after
`notifications_test.rb` was converged (2 residual rows: "subscribed interleaved with event" equal-count,
"events are initialized with details" `assert_in_epsilon` unmapped; 4 tests parked under
`notifications-timed-subscriber-arity-and-event-cpu-allocations`).

Re-measured with `pnpm parity:test -- --assertions --missing --package activesupport` (count / kind / value):
deprecation_test 29/61/2, test_case_test 31/36/3, callbacks_test 16/26/1, broadcast_logger_test 7/31/0,
logger_test 11/14/1, tagged_logging_test 8/9/3, error_reporter_test 2/3/0, rescuable_test 2/4/3,
clean_logger_test 1/1/1.

Learned: mirror Rails' `Notifications::TestCase#setup` with a local `Fanout` set as `Notifications.notifier`
(see `notifications.test.ts` `setupTestCase`); `Fanout#inspect` now exists. Runtime-work files are listed in the
parent story's Context.

## Acceptance criteria

- Each file above reports 0 count/kind/value mismatches, or is parked/split with a filed story.
