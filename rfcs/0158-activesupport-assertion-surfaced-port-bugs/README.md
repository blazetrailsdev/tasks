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
priority: 3
---

# RFC 0158 — ActiveSupport port bugs surfaced by assertion convergence

## Why this RFC exists

RFC 0155 is the bucket for production bugs found while converging a test's
assertions onto Rails. By 2026-09-24 it held 245 stories across seven
packages, too many to read as one backlog. Its stories split cleanly by the
package the fix lands in, and ActiveSupport was the largest group that was
not ActiveRecord. That group is this RFC.

ActiveSupport had nowhere else to go. `0098-activesupport-ar-closure-port` is
closed. `0101-activesupport-out-of-closure-surface` is postponed and covers
only cache stores and XmlMini. Unlike activemodel, arel, actionpack, trailties
and ruby-compat, activesupport has no `<package>-surfaced-deviations` bucket.
So these 76 stories were not only a share of 0155's size. They were the whole
of activesupport's open convergence backlog, filed next to ActiveRecord work
that has nothing in common with it.

## Scope

**In:** a defect in ported production code under `packages/activesupport/src/`
or `packages/date/src/`, found while converging a test's assertions or body to
Rails. `packages/date` is included because it holds the Ruby `Time` / `Date` /
`DateTime` surface that ActiveSupport's core extensions build on, and a fix
there is usually driven by an `activesupport` test. When the RFC was split off,
the stories fell into five groups:

| Group                                                                           | Stories |
| ------------------------------------------------------------------------------- | ------- |
| `Time`, `Date`, `DateTime`, `Duration`, `TimeWithZone`                          | 26      |
| `ActiveSupport::Testing` and the Minitest assertion helpers                     | 22      |
| `Deprecation`, deprecation proxies, `Module#deprecate`                          | 10      |
| Logger, `BroadcastLogger`, `TaggedLogging`, Notifications, Callbacks, Rescuable | 10      |
| Core extensions: HWIA, `OrderedOptions`, `Enumerable`, `Chars`, `delegate`      | 8       |

The Testing group belongs here even when the parked test is an ActiveRecord
one. `assertRaises`, `assertDifference` and `assertNotCalled` are
ActiveSupport production code (`packages/activesupport/src/testing/`), and the
fix goes there.

**Out:**

- **Anything whose fix lands in another package stays in 0155**. That
  includes activerecord, activemodel, globalid and rack. It also includes a
  bug found by an activesupport test when the fix lands elsewhere.
- **Ruby-compat (MRI) surface goes to `0154-ruby-compat-surfaced-deviations`**
  when that RFC owns it, as it did under 0155. A story that needs both a
  ruby-compat primitive and an ActiveSupport call site is filed here. File the
  primitive in 0154 as its own story and name it in the body.
- **Test-side work** (rewriting a test to mirror the Ruby, spelling an
  assertion with the right helper) is the assertion axis, not a bug. It never
  belonged in 0155 and does not belong here.
- **Cache stores and XmlMini** that 0101 owns go to 0101. Only a store bug
  found by a converged assertion is filed here.

## How a story gets here

Use the same filing rules as 0155. The only difference is the RFC id:

```bash
pnpm tasks new 0158-activesupport-assertion-surfaced-port-bugs <slug> --body-file <path>
```

Pick the destination by one question: **which package's `src/` does the fix
land in?** If the answer is `activesupport` or `date`, file it here. For any
other package, file it in 0155. If you cannot tell yet, file it where the
parked test lives. Moving a story later is a markdown edit.

The body carries `## Context` and `## Acceptance criteria`. At minimum it gives
the parked test's name and file, the Rails `file:line` and what Rails does
there, the port's `file:line` and what it does instead, and how far you
actually got. The parked test gets a single `BLOCKED: <story-slug>` line.
0155 § "How a story gets here" explains why the slug is all that line holds.

## Definition of done for a story here

This is 0155's definition, unchanged:

- The production divergence matches Rails: same behaviour, same error class
  and message, same raise site.
- **The parked test is un-parked** (`it.skip` → `it`) and passes with its
  assertions unchanged, and its `BLOCKED:` line is deleted. A story is not
  done while its test is still skipped.
- `pnpm parity:test -- --assertions` does not regress for the file.

## Clusters

- **`surfaced-bugs`**: the same label 0155 uses, so the two RFCs read as one
  family. No story sets a `cluster:` yet. Group by the table under Scope
  instead.

## End condition

This RFC closes when no parked test in the tree points at an open story here.
Unlike 0155 it is not tied to 0132, which is already closed. The stories came
out of 0132's activesupport clusters, and ActiveSupport assertion work beyond
the AR closure is expected to keep filing here. It is a burndown, not a
permanent register. Each open row is a test that is not running.

## History

Split from 0155 on 2026-09-24 with 76 stories: 28 done, 29 ready, 11 draft,
4 blocked and 4 in progress. Done stories moved too, so that each package's
prior art sits next to its open work. Their slugs did not change, so every
`BLOCKED:` line and story citation in trails still resolves.
