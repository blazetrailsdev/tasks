---
title: "Add an on-demand lint:rewritten command so the rebase fallback is not a hand-assembled pipeline"
status: ready
updated: 2026-07-30
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5431 added `scripts/lint-rewritten-files.sh` plus `post-rewrite` /
`post-merge` husky hooks, which lint the files each replayed commit touches
after a rebase or merge. It only runs from a git hook. When the hook does not
fire — a rebase driven by a tool that bypasses hooks, `--no-verify`, a
hooks-less clone, or an agent that wants to check on demand — CONTRIBUTING.md
(`## After a rebase: lint the auto-merged files`) tells the reader to
hand-assemble a pipeline instead:

```bash
moved=$(git diff --name-only ORIG_HEAD..HEAD -- '*.ts' '*.tsx' ...)
if [ -n "$moved" ]; then echo "$moved" | xargs pnpm exec eslint; fi
```

That fallback is strictly worse than the hook it stands in for: it lints the
whole `ORIG_HEAD..HEAD` span, so it also reports on files only the new upstream
touched (byte-identical to upstream, already CI-linted), where the hook scopes
to `<new>^!` per rewritten commit. It also duplicates the extension list and the
empty-input guard, which can drift from the script.

## Acceptance criteria

- A `pnpm lint:rewritten` (or similar) script in `package.json` invokes the
  same `scripts/lint-rewritten-files.sh` logic on demand, accepting an explicit
  range or defaulting to `ORIG_HEAD..HEAD`, and reusing the existing
  scoping/extension/guard logic rather than restating it.
- CONTRIBUTING.md's manual fallback points at that command instead of an
  inline pipeline; the "noisier than the hook" caveat can then go away.
- The `git diff origin/main -- <file>` re-read step (step 2) stays — it covers
  the semantic cases lint cannot.

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
