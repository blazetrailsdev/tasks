---
title: "docs/trailties/trailties-thor-port.md contradicts the merged Thor port"
status: draft
updated: 2026-10-02
rfc: "0171-thor-port"
cluster: null
packages: []
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

`docs/trailties/trailties-thor-port.md` predates RFC 0171 and contradicts the port as merged:

- `:108` lists `line-editor/*`, `shell/terminal.ts`, `shell/{column,table,wrapped}-printer.ts`
  and `core-ext/hash-with-indifferent-access.ts` as carve-outs that "do not get TS files".
  `thor/line-editor.ts` and `thor/line-editor/basic.ts` shipped in trails#8372,
  `shell/terminal.ts` in trails#8360, and `core-ext/hash-with-indifferent-access.ts` in
  trails#8362.
- `:126` says `thor/line_editor.rb` and `line_editor/basic.rb` are deferred because Rails has
  "zero" `.ask` / `.yes?` call sites. RFC 0171's story `port-thor-line-editor-and-ask` records
  the opposite: `railties/lib/rails/generators/app_base.rb` and the credentials commands
  prompt through them, and `file_collision` is built on `ask`.
- `:15` describes a separate `@blazetrails/thor` package; the port lives at
  `packages/trailties/src/thor/` (api-compare's `PACKAGE_DIR_OVERRIDES.thor`,
  `eslint/thor-import-boundary.mjs`).

The authoritative carve-out list is `scripts/parity/unported-files/thor.ts`
(`runner.rb`, `rake_compat.rb`, `shell/html.rb`, `shell/lcs_diff.rb`,
`line_editor/readline.rb`).

## Acceptance criteria

- [ ] The doc's carve-out list and deferral table match `scripts/parity/unported-files/thor.ts`,
      or the doc is replaced by a pointer to RFC 0171 and that file.
- [ ] No claim remains that `LineEditor`, `Shell::Terminal` or
      `CoreExt::HashWithIndifferentAccess` are unported, or that Thor is its own package.
