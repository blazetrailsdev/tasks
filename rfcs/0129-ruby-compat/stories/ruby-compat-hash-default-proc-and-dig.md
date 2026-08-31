---
title: "Hash default / default_proc and dig, scoped by a measured call-site inventory"
status: in-progress
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport", "activerecord"]
deps: ["ruby-compat-hash-fetch-and-key-error"]
deps-rfc: []
est-loc: 220
priority: 13
pr: 7284
claim: "2026-08-31T02:00:20Z"
assignee: "ruby-compat-hash-merge-and-iteration"
blocked-by: null
closed-reason: null
---

## Context

The second half of Ruby `Hash` semantics JS gives us nothing for. Unlike `fetch`,
this population is **not** yet fully measured, and the first task of this story is
to measure it — the standing rule ("only what trails actually calls") means the
inventory drives the export list, not MRI's method list.

What the inventory already shows:

**`default` / `default_proc`.** The one full implementation is
`activesupport/src/hash-with-indifferent-access.ts:57-156` — `_defaultProc`
storage (`:67`), the `Hash.new(obj)` vs `Hash.new { |h, k| … }` distinction
(`:73-77`), the `default(key)` read that runs the proc (`:126-133`), the
dup-clears-proc behaviour pinned by `test_dup_with_default_proc_sets_proc`
(`:141-146`), and the `defaultProc()` reader read by `set_defaults` (`:150-156`).
HWIA is a Rails-anchored class, so that code stays where it is — but it is
implementing Ruby Hash semantics inline, and it is the reference for what the
shared primitive must do.

The concrete demand comes from **RFC 0128's
`converge-alias-tracker-constructor-onto-rails-two-parameters`**: Rails'
`AliasTracker#initialize` takes two parameters
(`vendor/rails/activerecord/lib/active_record/associations/alias_tracker.rb:53`)
and trails' takes four, because `create` builds an `aliases` Hash whose
`default_proc` closes over `connection` and `joins` (`alias_tracker.rb:14-22`) and
"a JS `Map` has no default_proc, so the port pushed the two closed-over values
into the constructor". That story's proposed shape — "a Map subclass whose `get`
miss runs the closure `create` built" — **is** this primitive. Coordinate: this
story supplies it, that story consumes it.

**This story answers an existing open question.** RFC 0023's draft
`plain-object-has-no-hash-default-seat` (surfaced by PR #6626, which gave HWIA a
real `default` / `default_proc` seat) says in as many words: "Decide where a
plain-object default seat lives." It lists the sites that lose the seat —
`to_hash` (`hash_with_indifferent_access.rb:376-381`) calling `set_defaults(copy)`
on the plain Hash it returns, and `Hash#slice!` (`core_ext/hash/slice.rb:13-14`)
doing `hash.default = default` / `hash.default_proc = default_proc if
default_proc`, for which `core-ext/hash/slice.ts` already carries a
`@missingRailsCall default`. This package is the answer to that question; adopt
those sites here and record in the PR body that the 0023 story is discharged.

**`dig`.** Rails-anchored `dig` methods (`actionpack/.../request/session.ts:258`,
`.../strong-parameters.ts:509`, `.../test-case.ts:795`) stay put — they are ports
of Rails methods. The candidate is the private helper reached from
`activerecord/src/store.ts:220-235`. Confirm whether it is Ruby's `Hash#dig`
semantics (nil-safe traversal, `TypeError` on a non-diggable intermediate) or
something narrower before porting it.

**Insertion-ordered / non-string keys and `to_h`**: inventory before scoping.
A JS object coerces every key to a string and a `Map` does not have Ruby's
`==`-based key equality; find the call sites where that difference is currently
being worked around, and ship only those.

**Measured and OUT: `compare_by_identity`.** Its only occurrence is
`packages/rack/src/headers.ts:481`, a Rails-anchored override that raises
`TypeError` (`headers.test.ts:377`), so no call site needs the real semantics.
Do not port it.

## Acceptance criteria

- The PR body opens with the **inventory**: every call site found for
  `default` / `default_proc`, `dig`, non-string-key or insertion-order
  dependence, and `to_h` — with `file:line` — and states which are in scope and
  which are not.
- Only members with a real call site are exported; each is named in the PR body
  with its caller. `compare_by_identity` is not among them.
- A `default_proc`-carrying Hash whose miss path runs a caller-supplied closure,
  usable by RFC 0128's alias-tracker convergence — that story is named in this
  one's PR body as the consumer, and this story does NOT itself change
  `AliasTracker` (separate story, separate PR).
- `vendor/ruby/hash.c:LINE` citations for every ported member
  (`rb_hash_default`, `rb_hash_set_default_proc`, `rb_hash_dig`, …).
- HWIA is unchanged unless the shared primitive can absorb its inline
  implementation without touching its Rails-anchored surface; if it can, the PR
  body says which of `:57-156` was absorbed.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:extra` show no new rows; activesupport and all three AR lanes
  green.
- If the inventory turns out to justify more than one PR's worth of work, ship
  `default` / `default_proc` (the story with a blocked consumer) and file the
  rest as a follow-on story.
