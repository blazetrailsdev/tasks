---
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
title: "ActiveSupport port bugs surfaced by assertion convergence — split from RFC 0155"
status: active
created: 2026-09-24
updated: 2026-09-24
owner: "@deanmarano"
packages:
  - "activesupport"
  - "date"
clusters:
  - "surfaced-bugs"
related-rfcs:
  - "0155-assertion-surfaced-port-bugs"
  - "0132-ar-closure-assertion-parity"
  - "0156-parity-beyond-name-presence"
  - "0154-ruby-compat-surfaced-deviations"
  - "0101-activesupport-out-of-closure-surface"
priority: 5
---

# RFC 0158 — ActiveSupport port bugs surfaced by assertion convergence

## Summary

This RFC holds bugs in ported ActiveSupport code that were found by converging
a test's assertions onto Rails, and that are fixed in `packages/activesupport/src/`
or `packages/date/src/`. It was split out of
`0155-assertion-surfaced-port-bugs` on 2026-09-24 and took 78 of 0155's 248
stories with it. 45 of them are still open. Filing works exactly as it does in
0155: park the test, file the bug and move on. The destination is decided by
one question: **which package's `src/` does the fix land in?**

## Motivation

0155 was created (tasks#141) so that RFC 0132's assertion burndown would stop
growing a tail of production fixes. It worked, and by 2026-09-24 it held 245
stories across seven packages. It was too big to read as one backlog, and the
share by package was lopsided:

| Package the fix lands in             | Stories | Open |
| ------------------------------------ | ------- | ---- |
| activerecord, activemodel and others | 170     | 122  |
| activesupport + date                 | 78      | 45   |

ActiveSupport had nowhere else to go:

- `0098-activesupport-ar-closure-port` is closed.
- `0101-activesupport-out-of-closure-surface` is postponed and covers only
  cache stores and XmlMini.
- activemodel (0134), arel (0124), actionpack (0141), trailties (0142) and
  ruby-compat (0154) each have a `<package>-surfaced-deviations` bucket.
  activesupport does not.

So these 78 stories were all of activesupport's open convergence backlog,
filed next to ActiveRecord work they have nothing in common with. Someone
working on `TimeWithZone` or `Deprecation` had to filter a 248-row RFC to find
their own work.

## Design

### Scope

**In:** a defect in ported production code under `packages/activesupport/src/`
or `packages/date/src/`, found while converging a test's assertions or body to
Rails. `packages/date` is included because it holds the Ruby `Time` / `Date` /
`DateTime` surface that ActiveSupport's core extensions build on, and a fix
there is usually driven by an `activesupport` test.

This includes `packages/activesupport/src/testing/`. `assertRaises`,
`assertDifference`, `assertNotCalled` and the rest are ActiveSupport
production code, so a helper bug belongs here even when the test it blocks is
an ActiveRecord one.

### Where a story goes

This table is repeated in 0155 § "Which bucket: 0155 or 0158".

| Fix lands in                                                 | File it in                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| `activesupport` or `date`                                    | here                                                         |
| `activerecord`, `activemodel`, `globalid`, `rack`, any other | `0155-assertion-surfaced-port-bugs`                          |
| `ruby-compat`, when 0154 owns the primitive                  | `0154-ruby-compat-surfaced-deviations`                       |
| cause not established yet                                    | where the parked test lives; moving later is a markdown edit |

Suppose a story needs a ruby-compat primitive and an ActiveSupport call site.
It is filed here, and the primitive is filed in 0154 as its own story and
named in the body. A remainder story for an ActiveRecord test file that is
partly waiting on an ActiveSupport helper stays with that file in 0155. For
example, `assertions-has-many-associations-remainder-13` did not move.

### Filing

```bash
pnpm tasks new 0158-activesupport-assertion-surfaced-port-bugs <slug> --body-file <path>
```

The body carries `## Context` and `## Acceptance criteria`. At minimum it
gives:

- the parked test's name and file;
- the Rails `file:line` and what Rails does there;
- the port's `file:line` and what it does instead;
- how far you actually got.

The parked test gets a single `BLOCKED: <story-slug>` line. 0155 § "How a
story gets here" explains why the slug is all that line holds.

### Definition of done for a story

This is 0155's definition, unchanged:

- The production divergence matches Rails: same behaviour, same error class
  and message, same raise site.
- **The parked test is un-parked** (`it.skip` → `it`) and passes with its
  assertions unchanged, and its `BLOCKED:` line is deleted. A story is not
  done while its test is still skipped.
- `pnpm parity:test -- --assertions` does not regress for the file.

## Non-goals

- **Anything whose fix lands in another package.** Those stories stay in 0155
  or go to the package's own bucket.
- **Test-side work**, such as rewriting a test to mirror the Ruby or spelling
  an assertion with the right helper. That is the assertion axis, not a bug.
  It never belonged in 0155 and does not belong here.
- **Deviation-register entries.** This is a bug bucket, not a new
  `activesupport-surfaced-deviations`. Creating that bucket is a separate
  decision (see Open questions).
- **Cache stores and XmlMini that 0101 owns.** Only a store bug found by a
  converged assertion is filed here.
- **Parity tooling that would have caught these bugs.** That belongs to
  `0156-parity-beyond-name-presence`.

## Alternatives considered

I read all 245 stories in 0155 before choosing a split. Three more were filed
while this PR was open, and the same rule placed them. For each story I
collected the trails `src/` and `*.test.ts` paths, the Rails path and the DB
status.

- **Split by the package the fix lands in (chosen).** 170 of the 245 bodies
  name a trails production `src/` path. Another 63 name only a trails test or
  helper path, 6 name only a Rails `lib/` or `test/` path, and 6 name neither.
  In all 75 of those, the title and body make the package clear. One story sat
  on the line and stayed in 0155 by the remainder rule above.
- **Split by defect shape**, using the 13 shapes in 0156's
  `audit-20260920.md`: rejected. The largest shape has only 27 stories. The
  audit counts about 15 borderline calls between shapes. And the shape is often
  unknown until the root cause is, so an agent would need a diagnosis just to
  file.
- **Split test-helper surface from production bugs**: rejected. It moves only
  about 45 stories, and `ActiveSupport::Testing` is itself production code. The
  pure test-side rewrites were out of scope for 0155 already, so giving them an
  RFC would approve the misfiling.
- **Split by owning RFC or parked test file**: rejected. Every story traces
  back to 0132, so there was only one owning RFC to split by. Splitting by test
  file scatters a single helper bug across the five AR files it blocks.
- **Split out only Time, Date, Duration and TimeWithZone**: rejected. It moves
  only 26 stories and leaves the other 50 activesupport stories in an RFC that
  is otherwise ActiveRecord and ActiveModel.
- **Archive the terminal stories**: rejected. That is not a coherent RFC, and
  it leaves 174 open stories in one place.
- **Leave the done stories in 0155 as a record**, as 0132 did with its four:
  rejected. 0132's four were filed before the bucket existed, under 0132's own
  scope. These 28 have the same scope as this RFC. Keeping them next to the
  open work keeps the prior art on `TimeWithZone`, `Deprecation` and the
  assertion helpers in one place. A moved story keeps its slug, so every
  `BLOCKED:` line and citation still resolves.

## Rollout

This RFC is a bucket, not a sequence, so the groups below can be worked in any
order. They are listed by how many other stories each one unblocks. The counts
cover every story, and only open story IDs are listed. Status is from the DB
as of 2026-09-24, after rebasing onto main.

1. **`ActiveSupport::Testing` and the Minitest assertion helpers.** 22 stories, 9 open.
   These go first because a helper bug parks tests in every package.
   - Ready: `minitest-assertion-helpers-carry-false-norailsequivalent-receipts`, `port-activesupport-testing-stream-capture`, `shared-assert-not-called-watches-class-construction`, `testing-deprecation-helpers-do-not-require-a-deprecator`
   - Draft: `activesupport-assert-match-drops-respond-to-and-last-match`, `activesupport-callable-to-source-string-returns-string-not-callable`, `assert-deprecated-two-arg-form-drops-the-block`, `assert-nil-helper-sweep-remaining-packages`, `tagged-logger-does-not-memoize-rails-logger`
2. **`Time`, `Date`, `DateTime`, `Duration` and `TimeWithZone`.** 28 stories, 14 open.
   - Claimed: `date-civil-does-not-reject-extra-arguments`, `date-in-time-zone-return-type-includes-time`
   - Ready: `converge-date-and-time-calculations-to-this-typed-mixin`, `duration-sum-guard-is-an-instanceof-list-not-acts-like`, `duration-test-env-tz-zero-and-integer-division`, `time-weekday-helpers-return-instant-not-time`
   - Draft: `delete-legacy-time-ext-floor-ceil-helpers`, `instanceof-time-sites-assume-twz-is-not-a-time`, `time-instanceof-dispatch-arms-now-admit-time-with-zone`, `time-subsec-drops-subnano-residual`, `time-with-zone-rejects-tzinfo-timezone-zone`
   - Blocked: `activesupport-time-new-timezone-object-argument`, `activesupport-time-to-datetime-start-and-to-time`, `time-date-class-methods-allocate-receiver-subclass`
3. **`Deprecation`, deprecation proxies and `Module#deprecate`.** 10 stories, 8 open.
   - Claimed: `deprecated-constant-proxy-does-not-raise-on-a-missing-child-constant`, `deprecated-constant-proxy-is-not-transparent-to-equality`, `deprecation-callstack-blame-has-no-eval-file-attribution`
   - Ready: `deprecation-behavior-does-not-accept-callable-objects`, `deprecation-proxies-do-not-require-a-deprecator`, `deprecation-proxy-cannot-intercept-object-prototype-methods`, `deprecation-silence-and-allow-restore-before-an-async-block-settles`
   - Draft: `activesupport-deprecation-tests-bypass-module-deprecate`
4. **Logger, `BroadcastLogger`, `TaggedLogging`, Notifications, Callbacks and
   Rescuable.** 10 stories, 7 open.
   - Ready: `logger-default-simple-formatter-and-nonstring-inspect`, `notifications-subscribe-overloads-reject-rails-shaped-callbacks`, `notifications-timed-subscriber-arity-and-event-cpu-allocations`, `rescuable-has-no-rescue-handlers-reader`, `reset-callbacks-does-not-remove-from-descendants`, `tagged-logging-proxy-is-not-a-formatter-extension`
   - Draft: `logger-add-evaluates-block-message`
5. **Core extensions: HWIA, `OrderedOptions`, `Enumerable`, `Chars`,
   `delegate` and the cache lookup.** 8 stories, 7 open.
   - Claimed: `cache-lookup-store-has-no-mem-cache-or-redis-store`
   - Ready: `enumerable-sum-index-with-and-excluding-port-gaps`, `hwia-has-no-enumerator-form-or-yaml-dump`, `hwia-test-enumerator-and-yaml-remainder`, `ordered-options-key-does-not-tell-symbol-from-string`
   - Draft: `chars-length-counts-utf16-units`
   - Blocked: `activesupport-delegate-private-and-ruby-method-semantics`

## Verification

- **Open stories reach 0**, down from 45 at merge time, apart from new stories
  filed by later convergence work. Measure with
  `pnpm tasks list --rfc 0158-activesupport-assertion-surfaced-port-bugs`.
- **No parked test points at an open story here.** Measure with
  `grep -rhoE "BLOCKED: [a-z0-9-]+" packages/` in trails, intersected with
  this RFC's open slugs. At merge time, 21 of the 78 slugs are cited that way.
- **Each un-parked file keeps or improves its assertion count.** Check with
  `pnpm parity:test -- --assertions`, as in the definition of done.

## End condition

This RFC closes when both Verification counts are 0. Unlike 0155 it does not
depend on 0132, which is already closed. The stories came out of 0132's
activesupport clusters, but ActiveSupport assertion work beyond the AR closure
is expected to keep filing here. It is a burndown, not a permanent register:
each open row is a test that is not running.

## Open questions

1. **Should activesupport also get an `activesupport-surfaced-deviations`
   bucket?** Every other core package has one. Deferred: nothing in this split
   needs it, and deviation-register entries are a non-goal here. It can be
   decided when the first activesupport deviation-register entry needs a home.
2. **`activesupport-delegate-private-and-ruby-method-semantics` is blocked on a
   shortcoming that CLAUDE.md ratifies** (§ "Method visibility is not a runtime
   fact in JS"). That block may be permanent. Deferred to whoever next triages
   the story: close it against the ratified section, or narrow it to the
   `nil`-receiver and `source_location` arms that could still converge.
3. **Should `cache-lookup-store-has-no-mem-cache-or-redis-store` move to 0101?**
   Deferred: 0101 is postponed, and the story is a lookup-store bug found by a
   converged assertion, so it stays here under the Non-goals rule until 0101
   reopens.

## Changelog

- 2026-09-24: while the PR was open, two stories were filed in 0155 whose
  fix lands in `packages/date` (`time-subsec-drops-subnano-residual`) and
  in `packages/activesupport` (`delete-legacy-time-ext-floor-ceil-helpers`).
  Both moved here too, bringing the total to 78.
- 2026-09-24: split from `0155-assertion-surfaced-port-bugs`. Moved 76
  stories: 28 done, 29 ready, 11 draft, 4 blocked and 4 in progress. Every
  story slug is unchanged.
