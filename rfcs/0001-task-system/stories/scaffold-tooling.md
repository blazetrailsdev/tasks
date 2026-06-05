---
title: "Scaffold rfcs repo, scripts/tasks/, and the rfcs CLI"
status: done
updated: 2026-05-29
rfc: "0001-task-system"
cluster: scaffold
deps: []
est-loc: 250
pr: 2552
claim: "2026-05-28T17:26:39Z"
assignee: "scaffold-tooling"
blocked-by: null
---

## Context

The task system needs four things before any RFC content can be authored:
the sibling `tasks` repo, the directory skeleton inside it, the index
builder, and the CLI. This story delivers all four with zero functional
impact on the trails repo — no plan doc is modified, no skill behavior
changes.

See RFC 0001 §Repository split, §Directory layout, and §CLI surface.

## Acceptance criteria

- [ ] `blazetrailsdev/tasks` repo created with bootstrap layout
      (`README.md` with §Lifecycle, `index.md`, `rfcs/0000-template/`,
      `rfcs/0001-task-system/README.md`, `rfcs/0001-task-system/stories/*.md`)
- [ ] `0000-template/` contains a copy-ready RFC README with placeholder
      frontmatter and one `stories/template-story.md` showing the story
      shape
- [ ] `tasks/README.md` documents the RFC lifecycle (draft / active /
      closed / postponed / superseded) per RFC 0001 §Lifecycle
- [ ] This RFC's README and three stories moved from
      `trails/docs/rfcs/0001-task-system/` into the sibling repo's
      `rfcs/`; bootstrap
      copy deleted from trails
- [ ] `tasks` repo has prettier + markdownlint configured with a pre-commit
      hook (husky or simple-git-hooks) and a CI job running both
- [ ] Pre-commit hook also regenerates `index.md`, `index.json`, and
      `search.json` from current frontmatter, staging the regenerated files;
      hook completes in <500ms on warm cache (mtime-gated, incremental)
- [ ] `tasks` repo CI runs frontmatter validation (schema, dep-cycle, ID
      uniqueness, cluster match against parent RFC), a file-size check that
      fails any `.md` over 2000 lines, and verifies the committed indices
      match a fresh rebuild
- [ ] `pnpm tasks claim` implements the git-based atomic claim per RFC 0001
      §Concurrent claim (pull-rebase, verify, edit, push, retry on
      non-fast-forward)
- [ ] `scripts/tasks/build-index.ts` in the trails repo parses story
      frontmatter from `$TASKS_DIR` (default `../tasks/`) and writes
      `.tasks/index.db` per the schema in RFC 0001
- [ ] `scripts/tasks/cli.ts` implements `ready`, `next-bundle`, `claim`,
      `done`, `block`, `list`, `status` — all with `--json` where applicable
- [ ] `pnpm tasks <cmd>` wired in trails root `package.json`
- [ ] `.tasks/` gitignored in trails
- [ ] Index auto-rebuilds when any sibling-repo `stories/*.md` is newer
      than `index.db`
- [ ] Smoke test: `pnpm tasks list --json` returns this RFC's stories from
      the sibling repo

## Notes

Use `better-sqlite3` (already transitive via the SQLite adapter) and
`js-yaml` (already in the workspace via vitest). Do not add new deps to
trails.

The `tasks` repo can take its own minimal devDeps for prettier +
markdownlint — no need to share trails' toolchain.

LOC budget is tight (250). Keep the CLI argument parsing minimal —
hand-rolled `process.argv` slicing is fine; no need for `commander` or
similar.
