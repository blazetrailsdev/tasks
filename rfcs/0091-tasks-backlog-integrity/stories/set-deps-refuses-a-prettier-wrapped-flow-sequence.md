---
title: "tasks set-deps refuses a deps list prettier wrapped onto several lines"
status: draft
updated: 2026-10-01
rfc: "0091-tasks-backlog-integrity"
cluster: null
packages: []
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

Surfaced on trails PR 8349. `tasks set-deps <id> --add <dep>` refuses a story
whose `deps:` is a flow sequence that prettier wrapped onto several lines:

```text
$ pnpm tasks set-deps ruby-compat-has-no-marshal-for-schema-cache-and-debug --add ruby-compat-marshal-load-core-types
error: refusing to set nested/multi-level frontmatter key "deps" in …/ruby-compat-has-no-marshal-for-schema-cache-and-debug.md
```

That file's frontmatter was:

```yaml
deps:
  [
    "ruby-compat-marshal-core-types",
    "schema-cache-dump-and-load-through-psych",
    "debug-helper-through-object-to-yaml",
  ]
```

The raise is `src/frontmatter.ts:128` in the tasks repo. The same verb rewrote
a single-line `deps: []` into a block list (`deps:\n  - a\n  - b`) without
complaint on the same day, so the refusal is about the wrapped flow form only.
prettier produces that form for any `deps` list too long for one line, so every
story with three or more long dep ids is unreachable by the verb, and the
edit has to go by hand through a tasks-repo PR. CLAUDE.md names `set-deps` as
the way to avoid exactly that.

## Acceptance criteria

- [ ] `tasks set-deps` / `set-deps-rfc` (`--add`, `--remove`, and the full
      csv form) accept a `deps` value in all three YAML spellings: one-line
      flow, wrapped flow, and block list. The dangling-reference and cycle
      checks still run.
- [ ] A test in the tasks repo covers the wrapped flow form, alongside the
      existing "refuses a nested/multi-level structure" case
      (`src/ported.test.ts:713`), which keeps refusing a genuinely nested
      value.

## Verification

In the tasks repo: `pnpm vitest run src/ported.test.ts`.
