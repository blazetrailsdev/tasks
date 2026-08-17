---
title: "Last-segment collision silently disables method-order lint for a whole file"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Every `pnpm parity:api` run prints:

```text
[build-rails-file-structure-manifest] last-segment collision in
actiondispatch/journey/scanner.rb: `Scanner` shared by
ActionDispatch::Journey::Scanner, ActionDispatch::Journey::Scanner::Scanner
— bucket DROPPED (no order enforced).
```

The manifest keys ordering buckets by the FQN's last segment, so a nested class
whose short name equals its parent's collides and the builder drops the bucket
rather than picking a winner. The result is a SILENT lint no-op: the
`rails-file-structure-method-order` rule enforces nothing for that file, and
the message is one warning line in a long run, so it stays invisible.

Noticed while running `parity:api` for PR #5458. The count is currently one
file, which is what makes it cheap to fix now; the failure mode (drop, don't
fail) means any future collision is equally silent.

## Acceptance criteria

- Disambiguate colliding last segments (key by FQN, or qualify the nested
  entry) so `actiondispatch/journey/scanner.rb` gets an enforced bucket
  instead of a dropped one.
- A collision that still cannot be resolved fails the manifest build or is
  recorded in a checked-in list, rather than printing one warning and
  continuing with the rule disabled.
- Confirm the ordered-name count in
  `eslint/rails-file-structure-method-order.json` grows by the recovered
  bucket (baseline: 1045 files, 14779 ordered names).

## Re-verified 2026-08-17 (ready sweep)

Still valid, verbatim — the warning still prints on every run. Captured from the
2026-08-17 `pnpm parity:api`:
`[build-rails-file-structure-manifest] last-segment collision in
actiondispatch/journey/scanner.rb: 'Scanner' shared by
ActionDispatch::Journey::Scanner, ActionDispatch::Journey::Scanner::Scanner —
bucket DROPPED (no order enforced).` One collision, same file as filed.
