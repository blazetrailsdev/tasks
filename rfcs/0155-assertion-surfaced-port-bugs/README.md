---
rfc: "0155-assertion-surfaced-port-bugs"
title: "Port bugs surfaced by assertion convergence — RFC 0132's overflow bucket"
status: active
created: 2026-09-18
updated: 2026-09-24
owner: "@deanmarano"
packages:
  - "activerecord"
  - "activesupport"
  - "activemodel"
  - "date"
  - "globalid"
  - "sqlite3"
  - "ruby-compat"
clusters:
  - "surfaced-bugs"
related-rfcs:
  - "0132-ar-closure-assertion-parity"
  - "0105-ar-deps-test-parity-100"
  - "0122-arel-assertion-parity"
priority: 3
---

# RFC 0155 — port bugs surfaced by assertion convergence

## Why this RFC exists

RFC 0132 converges the ActiveRecord closure's test assertions onto Rails. Doing
that keeps turning up a second, different kind of defect: the test now asserts
what Rails asserts, and **the port does not do it**. An unported method, a
divergent cast, a guard Rails does not have.

Those are real and worth fixing. They are not assertion parity, and fixing them
inside an assertion-parity PR is what slowed 0132 down — the PR triples in size
and review rounds, and the rest of that story's files stall behind an unrelated
behaviour fix. 0132's rule is therefore "park the test, file the bug, move on"
(see its § "A converged assertion that fails is a story, not a detour").

**This RFC is where those filed bugs land.** It exists so that 0132 does not
keep growing a tail of production stories it cannot close, and so that a
converging agent has one obvious destination instead of a judgement call per
bug.

## Scope

**In:** a defect in ported **production** code — anything under a package's
`src/` that is not a `*.test.ts` — discovered while converging a test's
assertions or its body to Rails. Typically one of:

- an unported method or surface the mirrored assertion needs;
- a ported body that diverges from the Ruby (wrong arm, wrong cast, wrong
  default, a guard Rails does not have);
- a type that is wrong at a Rails-facing boundary;
- a test-helper surface the canonical schema or fixtures cannot express, where
  the fix is in `src/support/` or `src/test-helpers/` rather than in the test.

**Out:**

- **Test-side work stays in 0132.** Rewriting a test to mirror the Ruby,
  swapping a bespoke model for a canonical one, spelling an assertion with the
  right helper, replacing `association(...).target` with the public accessor —
  all of that is the assertion axis, however awkward.
- **Assertion tooling stays in 0132** — `assertion-kinds.ts`, the extractor, the
  mark file, the gate.
- **A bug with a better home goes to that home.** If an active RFC already owns
  the behaviour, file it there and say so; this bucket is the default, not a
  monopoly. Same for a package's `<package>-surfaced-deviations` bucket when the
  finding is a deviation register entry rather than a bug.

## How a story gets here

The converging agent files it at the moment of discovery, with the trails and
Rails `file:line` already in front of them:

```bash
pnpm tasks new 0155-assertion-surfaced-port-bugs <slug> --body-file <path>
```

The body carries `## Context` (both sides' `file:line`, what Rails does, what
the port does instead) and `## Acceptance criteria`. `tasks new` refuses a
skeleton body, and rightly: a title-only stub forces a re-derivation that costs
more than the original investigation.

**The story carries the finding; the test carries a pointer.** A parked test
gets one `BLOCKED: <story-slug>` line and nothing else —
`blazetrails/no-freeform-comments` strips anything past it
(`eslint/no-freeform-comments.mjs:84`), and that is the right shape anyway: a
comment is not reviewed, searched or scheduled, and a story is.

So a story here carries, at minimum:

- **which test is parked on it**, by name and file, so the fix has a definition
  of done that is not "hunt for what this was for";
- **the Rails `file:line`** and what Rails asserts or does there;
- **what the port does instead**, with its `file:line`;
- **how far you actually got.** "Isolated to this file; cause not established"
  is a good story. A confident root cause you did not verify is a worse one than
  no root cause at all.

## Definition of done for a story here

- The production divergence is converged on Rails — same behaviour, same error
  class and message, same site.
- **The parked test is un-parked** (`it.skip` → `it`) and passes with its
  assertions unchanged, and its `BLOCKED:` line is deleted with it.
  A story here is not done while its test is still skipped.
- `pnpm parity:test -- --assertions` does not regress for the file.

## End condition

This RFC is a standing bucket for as long as 0132 is burning down, and it
closes when both are true: 0132 is closed, and no parked test in the tree points
at a story here. It is not a permanent register — a row in it is a test that is
currently not running, which is exactly the debt it exists to make countable.
