---
title: "allHelpersFromPath globs *_helper, so no trails app helper is ever found"
status: draft
updated: 2026-09-06
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced porting `webhook/markdown.go` into trailmap (trailmap#8). The
renderer is a helper — exactly what `app/helpers` is for — but it could not be
reached from a view as a helper method, so `app/helpers/markdown-helper.ts`
exports a plain object a view has to `import` by path. The workaround is the
finding.

`allHelpersFromPath` globs the RUBY spelling:

    packages/actionpack/src/abstract-controller/helpers.ts:188
      const matches = await glob("**/*_helper.{ts,js,rb}", { cwd: root });
    packages/actionpack/src/abstract-controller/helpers.ts:189
      ...replace(/_helper$/, "")

Rails globs `**/*_helper.rb` because `snake_case.rb` is Ruby's file
convention. The TS port kept the glob verbatim while the file convention did
not come with it: generated and hand-written trails apps name files
kebab-case (trailties' own generator writes `app/helpers/account-helper.ts` —
see `packages/trailties/src/generators.trails.test.ts:50`). So the discovery
pass matches nothing a trails app actually writes, and `markdown-helper.ts`
is invisible to it.

The `.rb` extension in the glob is a second smell worth resolving in the same
pass: a trails app has no Ruby files to autoload.

## Expected shape

`allHelpersFromPath` matches the file convention the framework's own
generator emits — `**/*-helper.{ts,js}` — and derives the helper name from
the kebab-case stem the same way `modulesForHelpers` already camelizes a
string argument (`helpers.ts:170`). Whether the Ruby spelling stays accepted
as an alias is a call for the port; matching only `_helper` is the defect.

## Acceptance criteria

- A helper file named `app/helpers/markdown-helper.ts` is discovered by
  `allHelpersFromPath` and resolves to `MarkdownHelper`.
- Name derivation is covered for a multi-word kebab-case stem.
- Rails' own fixtures/tests for `all_helpers_from_path` still pass.
