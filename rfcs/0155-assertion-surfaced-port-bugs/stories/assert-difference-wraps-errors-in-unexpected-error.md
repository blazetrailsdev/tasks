---
title: "assertDifference/assertNoDifference rewrap errors in UnexpectedError; habtm_destroy_order matches by message"
status: draft
updated: 2026-09-19
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#7888. `habtm_destroy_order_test.rb` `test_may_not_delete_a_lesson_with_students` (`vendor/rails/activerecord/test/cases/habtm_destroy_order_test.rb:8-19`) wraps `assert_no_difference("Lesson.count") { sicp.destroy }` inside `assert_raises LessonError`, so the `LessonError` must reach `assert_raises` intact.

trails' `assertNoDifference` / `assertDifference` (`packages/activesupport/src/testing/assertions.ts`, via `_assertNothingRaisedOrWarn` and `assertNothingRaised`) rewrap any error in `UnexpectedError`, so `rejects.toThrow(LessonError)` fails. Rails' `_assert_nothing_raised_or_warn` (`activesupport/lib/active_support/testing/assertions.rb:286-298`) re-raises the `Minitest::UnexpectedError` too, so how Rails gets the original class through here is not established. The ported test matches `/LessonError/` on the message instead.

## Acceptance criteria

- Establish what Rails' `assert_raises` sees for an error raised inside `assert_no_difference`, and make the trails helper deliver the same class.
- `habtm-destroy-order.test.ts` "may not delete a lesson with students" asserts `LessonError` by class.
