---
title: "Measure and cut SQLite statement compilation for unpreparable queries"
status: ready
updated: 2026-11-16
rfc: "0241-request-path-performance"
cluster: request-perf
packages: [activerecord]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Post.withDetails` selects raw SQL strings, so Arel marks the query
unpreparable and `performQuery` compiles a fresh statement for every request
(`_freshStatement`, `packages/activerecord/lib/connection-adapters/sqlite3-adapter.ts:1154`),
then closes it. This matches Rails exactly
(`sqlite3/database_statements.rb:92-107`, "Don't cache statements if they are
not prepared"), and the gambitboy Rails app runs the same scope.

The cost is not the same, though. Under the twelve-dollar load, better-sqlite3's
`prepare` is **7.4% of busy CPU** in self time, and the whole `_freshStatement`
path is **8.4%**. It is the largest single function in the profile. The SQL text
is identical on every request, because the binds stay as `?` placeholders.

## Acceptance criteria

- [ ] Measure what one `prepare` of the feed query costs in better-sqlite3 against
      the `sqlite3` gem, in a micro-benchmark outside the server, and record it.
- [ ] If trails is materially slower, find out where the time goes, whether in
      better-sqlite3's statement setup or in SQLite's compile, and fix it in the
      wrapper where possible.
- [ ] If the cost is SQLite's own compile, propose (do not land) reusing compiled
      statements for unpreparable queries whose SQL carries bind placeholders. It
      would be a recorded deviation from Rails, so it needs a decision, and the
      proposal belongs in this RFC's Design section.

## Definition of done

A statement cache for unpreparable queries does not close this story unless the
RFC records the decision to deviate from Rails first.

## Verification

Run the slim profile harness from the RFC README's Verification section on
trails main before and after the change. Record CPU per request, p95, p99 and
this story's measured share in the PR body.
