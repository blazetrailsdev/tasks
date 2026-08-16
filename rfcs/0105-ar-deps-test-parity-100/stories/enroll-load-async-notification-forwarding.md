---
title: "Enroll load_async_test.rb's test_notification_forwarding now that lock_wait reaches the payload"
status: done
updated: 2026-08-16
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6589
claim: "2026-08-16T01:15:07Z"
assignee: "finder-methods-residue-find-with-ids-find-one-raise"
blocked-by: null
closed-reason: null
---

# Enroll `load_async_test.rb`'s `test_notification_forwarding` now that `lock_wait` reaches the payload

## Context

`vendor/rails/activerecord/test/cases/relation/load_async_test.rb` is listed in
`scripts/parity/unported-files/unscoped.ts`; the stated reason (recorded in
`packages/activerecord/src/future-result.trails.test.ts`) is that every live test
class there asserts thread-pool sizing, `scheduled?` interleaving or mutex
`lock_wait`, none of which is observable on a single-threaded event loop.

PR #6585 invalidated part of that for one test. `FutureResult::EventBuffer` is
now ported (`vendor/rails/activerecord/lib/active_record/future_result.rb:24-47`)
and stamps `payload[:lock_wait]` on every scheduled query's event
(`future_result.rb:43`), so `test_notification_forwarding`
(`load_async_test.rb:93-119`) is now expressible:

    subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") do |event|
      if event.payload[:name] == "Post Load"
        status[:async]     = event.payload[:async]
        status[:lock_wait] = event.payload[:lock_wait]
      end
    end
    deferred_posts = Post.where(author_id: 1).load_async
    wait_for_async_query
    assert_equal expected_records, deferred_posts.to_a
    assert_instance_of Float, status[:lock_wait]

PR #6585's coverage lives in `future-result.trails.test.ts` against a fake pool —
it proves the mechanism, not the end-to-end `load_async` path.

## Converged shape

`test_notification_forwarding` enrolled as `it("notification forwarding")` in the
Rails-named test file, driving a real `load_async` over the canonical schema and
`Post` fixtures, asserting the payload's `async` and `lock_wait` keys.

The `Thread.current.object_id` assertion has no JS counterpart and should be
dropped with a cited note, not faked.

## Notes

Enrolling a test file needs the four registrations (the file already has a
PERMANENT-SKIP stub holding every Rails test name verbatim — enrolling MODIFIES
it rather than replacing it), so scope this as an enrollment story, not a
one-test add.

## Acceptance criteria

- [ ] `notification forwarding` enrolled and passing on all three lanes.
- [ ] `unported-files` entry narrowed (not deleted) with the remaining
      thread-only tests still named.
- [ ] `pnpm parity:test` delta non-negative.
