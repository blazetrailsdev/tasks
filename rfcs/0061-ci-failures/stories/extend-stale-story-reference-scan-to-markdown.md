---
title: "extend-stale-story-reference-scan-to-markdown"
status: done
updated: 2026-08-03
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6001
claim: "2026-08-03T18:15:45Z"
assignee: "extend-stale-story-reference-scan-to-markdown"
blocked-by: null
closed-reason: null
---

## Context

`scripts/stale-story-references.ts` scans only `.ts` / `.mjs` under `packages/`,
`scripts/`, and `eslint/` (`SOURCE_ROOTS`, `collectSourceFiles`). Markdown names
landed stories too — `docs/` prose, RFC bodies, and story files that cite a
sibling story as their tracker — and none of it is guarded.

The matcher itself is now block-scoped with a sentence-scoped provenance veto
(see the story that widened it), so the phrase machinery carries over unchanged.
What does not carry over is `COMMENT_LINE`: in markdown every line is prose, so
the block segmentation has to key off paragraphs (blank-line separated) rather
than comment markers, and fenced code blocks should be skipped so an example
comment in a fence is not read as a real promise.

Two hazards to design around before widening:

- The tasks repo is checked out at `tasks/` (a symlink in agent worktrees). Its
  own story files legitimately cite landed stories as dependencies and
  provenance; scanning them would be almost all false positives. Scope the
  markdown scan to the trails tree.
- `docs/activerecord/` is frozen (RFC 0011 Phase 4) — CI's
  `Docs ActiveRecord Freeze` job fails any PR that modifies a file there
  (allowlist: `parity-verification.md`). A finding in that tree cannot be fixed
  by editing the prose, so decide up front whether to exclude it or to route
  such findings somewhere else.

## Acceptance criteria

- The scan covers `.md` under the trails tree (at minimum `docs/`), with
  paragraph-scoped blocks and fenced code blocks skipped.
- `tasks/` and the frozen `docs/activerecord/` tree are handled deliberately
  (excluded, or findings routed somewhere actionable) — not left to red the
  gate with unfixable hits.
- Every citation the widened scan surfaces is audited and resolved the same way
  the .ts audit was: converge, correct the prose, or file a convergence story
  and repoint.
- `pnpm vitest run scripts/stale-story-references.test.ts` green on `main`.
