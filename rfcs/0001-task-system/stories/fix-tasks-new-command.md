---
title: "Fix `tasks new`: emit hook-clean stories and validate --cluster"
status: done
updated: 2026-06-08
rfc: "0001-task-system"
cluster: scaffold
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3049
claim: "2026-06-08T20:52:13Z"
assignee: "fix-tasks-new-command"
blocked-by: null
---

## Context

`pnpm tasks new` writes a story file but its output fails the tasks-repo
pre-commit hooks, so the command never actually commits — every invocation dies
at `husky`. Root cause: the command code lives in `trails` and is unit-tested
with `node:child_process` fully mocked, so the generated markdown is never run
through the tasks repo's markdownlint, prettier, or `validate.mjs`. Observed
2026-06-08 while filing `claims-concurrency-lock` (took five manual fix passes).

Concrete defects in `buildStoryContent` / `newStory`:

- Trailing and double blank lines trip markdownlint `MD012`.
- The body is not prettier-clean.
- `## Context` and `## Acceptance criteria` are `TODO` placeholder stubs, which
  violate the no-placeholder rule.
- `--cluster` is only checked against `SLUG_RE`, not the RFC README's declared
  clusters, so `validate.mjs` rejects unknown clusters (e.g. `tooling` in
  `0001-task-system`, which declares only `[scaffold, conversion]`).

## Acceptance criteria

- [ ] `buildStoryContent` output passes markdownlint and prettier with no edits.
- [ ] The generated body has no `TODO` placeholder stubs.
- [ ] `tasks new` validates `--cluster` against the target RFC's declared
      clusters and errors clearly, listing the valid clusters, before writing.
- [ ] `pnpm tasks new <rfc> <slug> --cluster <valid>` commits and pushes
      end-to-end against a real tasks checkout with no hook failure.
- [ ] An integration test runs the generated content through markdownlint,
      prettier `--check`, and `validate.mjs`, closing the mocked-git gap.

## Notes

Broader gap: the tasks CLI lives in `trails` but mutates the `tasks` repo, and
neither repo's CI exercises that integration. This story adds the one integration
test for `new`; a fuller tasks-CLI integration harness is a separate follow-up.
