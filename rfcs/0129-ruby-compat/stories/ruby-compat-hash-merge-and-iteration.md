---
title: "Hash mutation and iteration — merge, update, delete_if, each_pair, transform_values — get a call form"
status: done
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages:
  [
    "ruby-compat",
    "actioncontroller",
    "actiondispatch",
    "activemodel",
    "activerecord",
    "activesupport",
    "rack",
    "trailties",
  ]
deps: ["ruby-compat-hash-fetch-and-key-error"]
deps-rfc: []
est-loc: 260
priority: 12
pr: 7284
claim: "2026-08-31T02:00:20Z"
assignee: "ruby-compat-hash-merge-and-iteration"
blocked-by: null
closed-reason: null
---

## Context

The larger half of the Hash gap, and the one an earlier draft of this RFC missed
because it was reading `@missingRailsCall` receipts and not the call baselines.

`scripts/api-compare/call-mismatches-exclude/` carries **~48 rows** naming a Ruby
core Hash mutation or iteration call, spread across seven packages:

| Call               | Rows |
| ------------------ | ---- |
| `merge`            | 18   |
| `merge!`           | 7    |
| `delete_if`        | 4    |
| `each_pair`        | 3    |
| `each_key`         | 3    |
| `update`           | 3    |
| `transform_values` | 3    |
| `slice`            | 3    |
| `except`           | 2    |
| `reject`           | 2    |

Spread over actioncontroller (24), actiondispatch (14), activemodel (6),
activerecord (3), activesupport (3), rack (2) and trailties (1) — which is why no
package's own burndown has ever reached them, and why they need a package rather
than a sweep.

Where a row was individually adjudicated instead of seeded, its reason states the
problem exactly:

> Verified per-site (RFC 0106): `@defaults.merge(path.requirements)`
> (`route.rb:96`) is object spread `{ ...this.defaults, ...this.path.requirements }`;
> `Hash#merge` has no JS call form.
>
> Verified per-site (RFC 0106): `delete_if { |_, v| /.+?/m == v }`
> (`route.rb:96-98`) is spelled as an `Object.entries` loop with
> `delete merged[k]`; `Hash#delete_if` has no JS call form.
>
> Verified per-site (RFC 0106): `requirements.transform_values { … }`
> (`pattern.rb:178-180`) over a Ruby Hash; the TS counterpart is a plain object
> rebuilt by an `Object.entries` loop — `Hash#transform_values` has no JS call
> form (RFC 0092 positional-idiom-analogues).

Each is a correct description and, today, a permanent verdict — nothing in the
tree offers the call form they say is missing. This story supplies it.

**Ruby core vs Rails core_ext — do not conflate them.** `slice` (2.5) and
`except` (3.0) are Ruby core and in scope. `deep_transform_keys` /
`deep_transform_keys!` (5 further rows) and `reverse_merge` are **ActiveSupport**
extensions with real `.rb` counterparts; they stay in activesupport, keep their
`parity:api` coverage, and are excluded from the ~48.

**The receiver caveat applies with full force here**, more than anywhere else in
this RFC. `merge` is `Hash#merge` in `route.rb:96` and
`ActiveRecord::Relation#merge` in `activerecord/locking/optimistic.ts` — one is
Ruby core, the other is Rails and must keep flagging normally. Adjudicate every
row against its Ruby call site before converging it; a row you cannot resolve
stays baselined rather than being credited wrongly. The RFC's Open Question 2 is
about exactly this risk.

The `activerecord/locking/optimistic.ts :: _query_constraints_hash` row is the
worked example of a row to leave alone until its receiver is proven.

## Acceptance criteria

- The Ruby core Hash mutation/iteration members with baseline rows are exported
  from `packages/ruby-compat/src/hash.ts`, each with a `vendor/ruby/hash.c:LINE`
  citation (`rb_hash_merge`, `rb_hash_update`, `rb_hash_delete_if`,
  `rb_hash_each_pair`, `rb_hash_each_key`, `rb_hash_transform_values`,
  `rb_hash_reject`, `rb_hash_aslice`, `rb_hash_except`).
- Mutating and non-mutating pairs are BOTH ported and behave differently:
  `merge` returns a new Hash, `merge!` / `update` mutate the receiver and return
  it. Porting one as the other is the failure mode this story exists to prevent,
  and a test pins each pair.
- Every adopted call site is adjudicated against its Ruby receiver first; the PR
  body lists each converged row with its Ruby `file:line`, and each row left
  baselined with the reason it could not be resolved.
- Rows converged are deleted from the baseline **by hand, sorted, via
  `serializeBaseline`** — only-shrink, never `--write`, never a reseed. Where a
  deletion leaves a stale high-water mark, narrow it with
  `pnpm parity:api:calls:tighten <package>/<file>.json`.
- No Rails `core_ext` Hash method is moved; `deep_transform_keys`,
  `deep_transform_keys!` and `reverse_merge` are untouched.
- No `Relation#merge` call site is converged onto the Hash export.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params`, `parity:api:extra` green; every touched package's suite
  green and all three AR lanes green.
- **This will not fit one PR at 48 rows across seven packages.** Ship the
  members plus the packages that fit under the ceiling, and file the remaining
  packages as a follow-on story against this RFC with their row counts — do not
  fan out sibling PRs and do not stack branches.
