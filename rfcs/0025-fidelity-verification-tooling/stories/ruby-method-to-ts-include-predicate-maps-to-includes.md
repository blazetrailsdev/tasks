---
title: "rubyMethodToTs(include?) should offer includes as a candidate"
status: draft
updated: 2026-07-19
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #4953. Rails' PG `quote_default_expression` uuid branch is
`value.include?("()")`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:159-160`).
The faithful TS port is `value.includes("()")`, but the wide-call ratchet
still flags it, because `rubyMethodToTs("include?")` returns
`["isInclude", "include"]` — neither of which exists on a JS string.

`ALREADY_PREDICATE_PREFIXES` in `scripts/api-compare/conventions.ts:477-487`
already lists `"includes"`, but that rule matches Ruby names _starting with_
`includes`, so it never fires for the bare `include?`.

This is generic, not PG-specific: every Ruby `include?` → JS `.includes()`
port hits it, so each one has to be hand-excluded with a bespoke reason.
PR #4953 left exactly such an entry in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/postgresql/quoting.json`.

## Acceptance criteria

- [ ] `rubyMethodToTs("include?")` offers `includes` as a candidate, so a
      `.includes()` port satisfies the call ratchet without an exclude entry.
- [ ] Check the same class of Ruby predicate for the same gap (e.g. `exclude?`
      → `excludes`) and cover whichever are real.
- [ ] Drop the now-redundant `quote_default_expression`/`include?` entry from
      the PG quoting wide-call exclude.
- [ ] Sweep other wide-call excludes whose reason is an `include?` name
      mismatch and drop those too.
- [ ] `pnpm api:calls:wide` green; api:compare delta non-negative.
