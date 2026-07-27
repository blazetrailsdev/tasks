---
rfc: "0082-ruby-ts-idiom-conversion-classes"
title: "Ruby→TS idiom conversion classes"
status: active
created: 2026-07-27
updated: 2026-07-27
owner: "@your-handle"
packages:
  - "activerecord"
  - "arel"
  - "activesupport"
  - "activemodel"
clusters: []
priority: 3
---

# Ruby to TS idiom conversion classes

## Context

Recurring Ruby-to-JS idiom conversions in the trails port have been fixed
piecemeal — one story per symptom, scattered across RFCs. The Enumerable-to-JS
Array class (now settled via `scripts/api-compare/enumerable-idioms.ts` plus the
call ratchets) showed what a systematic per-class fix looks like: enumerate the
class, converge it in one campaign, then ratchet so it stays fixed. RFC 0081
(writer-accessor-convergence) is the same shape for the setter class.

This umbrella tracks the remaining scattered conversion classes with one
tracking story each. Tracking stories reference the existing scattered stories
by id — they do NOT re-home or duplicate them (a separate triage owns moves).
Full grouped analysis: `ruby-ts-conversion-classes-report.md` in the
group-ruby-ts-conversion-classes worktree branch.

Classes with existing homes get no story here: Enumerable aliases (extend the
0025 table), writer accessors (RFC 0081), casing/file paths and kwargs/arity
(conventions.ts + existing ratchets), core-object protocol and operators
(conventions SKIP list — out of scope by design).

## Stories

One per class: predicate Q-suffix retirement, symbol-vs-string argument arms,
Ruby-truthiness residuals, bang raise semantics, zero-arg method vs getter
shape, error-class naming.
