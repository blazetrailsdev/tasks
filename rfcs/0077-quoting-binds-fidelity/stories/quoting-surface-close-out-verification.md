---
title: "Close-out: verify the quoting surface against Rails and set RFC 0077's done condition"
status: done
updated: 2026-08-09
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6293
claim: "2026-08-09T19:09:16Z"
assignee: "mysql-quote-override-has-no-rails-counterpart"
blocked-by: null
closed-reason: null
---

## Context

Closing story for RFC 0077 — the check that the quoting/binds surface actually
matches Rails once the convergence stories land, so the RFC can be closed on
evidence rather than on "no open stories left".

The RFC's inventory was assembled per-file from PR-surfaced findings, never from
a single pass over the whole quoting surface. Two things in this shard's
2026-08-09 sweep show why that matters:

- `converge-quote-identifier-onto-quote-column-name` claimed "~123 non-test call
  sites"; on today's `main` a word-boundary grep finds **two** —
  `abstract/quoting.ts:84` and its single consumer in `sanitization.ts:10`. PR
  #5893 had already done the bulk, and the story's premise had gone stale
  without anyone noticing.
- A naive `grep quoteIdentifier` matches `unquoteIdentifier` — a **real Rails
  method** (`mysql/quoting.rb:84`, `postgresql/utils.rb:69`) — which is how the
  inflated count survived re-reads.

So the RFC needs one deliberate end-state verification rather than an implicit
one.

## Acceptance criteria

- [ ] `pnpm parity:api --package activerecord` is run scoped to the quoting
      files (`abstract/quoting.rb`, `mysql/quoting.rb`, `postgresql/quoting.rb`,
      `sqlite3` quoting) and every Ruby method is matched or has a `SKIP_GROUPS`
      entry with a reason.
- [ ] `pnpm parity:api:extra` reports no un-tagged extra name in those files; any
      surviving `@noRailsEquivalent` carries a reason a reviewer signed off on.
- [ ] The quoting rows in `call-mismatches-exclude` are enumerated: each is
      either deleted (converged) or carries a one-line reason naming the Rails
      `file:line` it deviates from.
- [ ] Emitted SQL is unchanged across the three adapters — capture the
      quoting/sanitization/schema-creation suites before and after.
- [ ] RFC 0077's README gets a `## Done when` section stating the above as the
      close condition, and the RFC moves to `closed` if it holds.
