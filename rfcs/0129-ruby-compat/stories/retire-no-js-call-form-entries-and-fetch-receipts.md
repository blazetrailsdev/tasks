---
title: "Retire the NO_JS_CALL_FORM entries and @missingRailsCall receipts that ruby-compat has given a call form"
status: in-progress
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport", "activerecord", "activemodel", "actionpack"]
deps: ["enroll-call-mapping-remaining-packages", "ruby-compat-hash-fetch-and-key-error"]
deps-rfc: []
est-loc: 240
priority: 17
pr: 7321
claim: "2026-09-01T00:46:36Z"
assignee: "retire-no-js-call-form-entries-and-fetch-receipts"
blocked-by: null
closed-reason: null
---

## Context

The payoff story. Two registers of debt exist solely because a Ruby core call had
no callable TS spelling; once ruby-compat supplies one, they are no longer
justified.

**`NO_JS_CALL_FORM`** (`scripts/api-compare/compare.ts:249-261`) globally
suppresses nine Ruby names. Two are ruby-compat's to discharge, and the table's
own comment (`:203-210`) says why they were added:

> `key?`/`has_key?` alias to `Map#has`, but Rails' options/params hashes port to
> object literals, whose membership tests are the `in` operator,
> `x.k !== undefined`, or destructuring with a default. The gate cannot tell a
> faithful `"k" in opts` from a dropped guard either way, so keeping them would
> baseline every options-hash port forever **with no way to ever discharge it.**

A callable `hasKey` is the discharge. Deleting the two entries un-suppresses their
population, so **expect new rows** — that is the point, and the story is sized for
converging them, not for baselining them wholesale.

**Not candidates, and this must not be argued otherwise using this story as
precedent:** `to_s` (a template literal), `each` (a `for…of`), `catch` (a clause,
not a callee — `compare.ts:263-269`), `synchronize` (JS has no mutex —
`compare.ts:271-278`), `present?` / `blank?` / `to_str` (truthiness and implicit
coercion). Those are language constructs, not calls a package can supply. A Ruby
`Mutex` is **deferred** by the RFC and would be the only thing that could revisit
`synchronize`.

**`@missingRailsCall` receipts.** 373 exist across `packages/*/src`. The ones this
story retires are those whose stated reason is "no JS call analogue" for a call
ruby-compat now exports — chiefly the **25 `fetch`** receipts
(`activesupport/src/json/encoding.ts:36`,
`number-helper/number-to-delimited-converter.ts:25`,
`number-helper/rounding-helper.ts:34`, and 22 more). Each is retired by making the
call, not by rewording the receipt. A receipt whose reason is something else
entirely stays.

**Prior art.** RFC 0106's `audit-missing-rails-call-permanence-claims` (done,
PR #6855) audited whether `@missingRailsCall … PERMANENT` claims were actually
permanent. Read its verdict before re-auditing: the `fetch` receipts were
defensible _then_, because no call form existed. This story is not overturning
that audit — it is discharging the receipts whose premise the package has
changed. RFC 0106's `port-hash-fetch-semantics-validate-and-seeds` (done, #6673)
established the semantics at specific sites and is the behavioural reference.

Deleting a receipt or a suppression makes previously-hidden calls visible, which
lowers no mark by itself but WILL surface rows. Follow the only-shrink discipline:
converge, and where you must baseline, add a reviewed one-line reason on the row
you add, sorted, via `serializeBaseline`. **Never `--write`.** Deleting a genuine
divergence's row leaves a STALE high-water mark; narrow it with
`pnpm parity:api:calls:tighten <package>/<file>.json`, never a reseed.

## Acceptance criteria

- `key?` and `has_key?` removed from `NO_JS_CALL_FORM`; the surrounding comment
  updated to record that ruby-compat discharged them, and to restate why the
  seven remaining entries are NOT candidates.
- Every `@missingRailsCall fetch — PERMANENT` receipt whose call site can now
  call ruby-compat's `fetch` is retired **by making the call**; the PR body
  reports the before/after receipt count.
- Any receipt left in place has a reason that is not "no JS call analogue"; the
  PR body lists them.
- Rows surfaced by the un-suppression are converged, or baselined with a
  reviewed per-row reason — sorted, via `serializeBaseline`, no reseed.
- `pnpm parity:api:calls`, `parity:api:calls:args`,
  `parity:api:calls:ruby-compat` all green; `parity:api:params` and
  `parity:api:extra` unchanged.
- All suites green, all three AR lanes.
- If the surfaced population is larger than one PR, ship `key?` / `has_key?` and
  file the `fetch` receipt burndown as a follow-on story with the measured
  count — do not fan out sibling PRs.
