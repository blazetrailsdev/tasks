---
title: "converge-generators-actions-gemfile-family-onto-package-json"
status: draft
updated: 2026-10-28
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::Actions` (`vendor/rails/v8.0.2/railties/lib/rails/generators/actions.rb`) edits the
Gemfile through `gem` (`:15-80`), `gem_group` (`:82-97`), `github` (`:99-118`) and `add_source`
(`:120-145`). They are built on the private helpers `quote` (`:476-485`), `indentation` (`:497-499`),
`with_indentation` (`:502-507`) and `append_file_with_newline` (`:509-513`), and on `initialize`'s
`@indentation = 0` (`:10-13`). Each runs `log` and then `in_root { append_file / prepend_file }`.

trails has none of these. Its stand-in is `pkg` in `packages/trailties/src/generators/trails-actions.ts`.
`pkg` rewrites `package.json` through `File.readAsync` / `File.writeAsync` against `this.cwd`, outside
`in_root` and without `log`. It carries `@noRailsEquivalent CONVERGEABLE` pointing here.

## Acceptance criteria

- [ ] Decide the trails shape of the Gemfile family (a `package.json` dependency edit), and port `gem` /
      `gem_group` / `add_source` (`github` only if it has an npm meaning) at their Rails names. Use
      `log` and `in_root` the way Rails does, and the private helpers they need.
- [ ] `pkg` is deleted, or kept as the `gem` body under its Rails name. Its callers move with it.
- [ ] The `@indentation` state is inlined into `GeneratorBase`'s constructor per the root CLAUDE.md
      § "A module's `initialize` is inlined into the constructor".
