# Instructions for AI coding agents

This repo tracks RFCs and stories for
[`blazetrailsdev/trails`](https://github.com/blazetrailsdev/trails). Its design
and conventions live in [`README.md`](../README.md), with the correctness
argument in [`VERIFICATION.md`](../VERIFICATION.md). **Read `README.md` first**
— this file only exists so agents that don't look for it still find it.

The rules that most often bite an outside contributor or reviewer:

- **Frontmatter fields have exactly one authority each, and the sets are
  disjoint.** Markdown owns `title`, `rfc`, `cluster`, `deps`, `deps-rfc`,
  `est-loc`, `priority`, `packages`, and the body prose — change those by
  editing the file and opening a PR. The DB owns `status`, `pr`, `claim`,
  `assignee`, `blocked-by`, `closed-reason`, `updated` — change those only
  through a `tasks` verb (`claim`, `in-progress --pr N`, `done --pr N`,
  `block`, `close`, `status-set`).
- **Hand-editing a DB-owned field fails silently, then loudly.** `tasks ingest`
  skips DB-owned columns by design, so `status: done` typed into a story file
  reads correctly to a human and marks nothing done. CI's owned-fields guard
  rejects the PR.
- **`tasks ingest` is a sync verb, not an inspection verb.** It publishes the
  branch into the shared database. To check that stories parse, use
  `tasks show` / `tasks list` / `pnpm validate`.
- **Create stories with `tasks new <rfc> <slug> --body-file <path>`**, never by
  inserting a row another way. It refuses an empty body on purpose.
- **`vendor/` is build output** — trails is vendored deliberately (see README's
  "trails is vendored"); don't edit it.
- Conventional Commits. Open PRs as draft. No `Co-Authored-By` trailer and no
  "Generated with Claude Code" line in commits, PRs, issues, or comments.
