---
title: "A production boot still reaches the trailties generator tree, and Thor with it"
status: closed
updated: 2026-11-01
rfc: "0192-package-entry-point-boot-cost"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: 'Premise refuted by measurement. engine.ts:226 is async loadGenerators(app = this) doing a lazy await import("./generators.js"), which mirrors railties/lib/rails/engine.rb:476''s load_generators exactly, so there is no Rails deviation to converge. The compile error the story cited was @blazetrails/thor having no dist in my worktree; once built, the 1937-module graph compiles (235 MB binary). The real finding is Perry const-folding a correct lazy boundary into a hard import edge, which is upstream, not trails backlog. Recorded in examples/perry-native/perry/FINDINGS.md.'
---

## Context

A production boot's module graph still reaches `trailties`' generator tree
after #9495, which cut the CLI off the `"."` export. Compiling `trails
server`'s own production path (`Handler.Node.run`, no Vite) to a native binary
stops with:

```text
Error: Could not resolve namespace import
  `import * as ... from "@blazetrails/thor/actions"`
  in base.ts (packages/trailties/src/generators/base.ts)
```

A native compiler refuses because the namespace would compile to an empty
object. A bundler does not refuse — it just ships the generators, Thor and the
template machinery into every deployed server. The compiler is the messenger
here, not the reason to fix it.

Measured on the merged tree (`997845bfb3` + the ladder in
`examples/perry-native`): playwright and vite are gone from the graph, so #9495
did its job; `generators/base.ts` is what is left.

The chain is NOT yet identified. `rails.ts:16` imports
`./generators/app-generator.js` as `import type`, which is erased, so that is
not it. A hand-rolled reverse walk over static imports found no path, which
means the walk missed subpath or `exports`-map edges rather than that no path
exists. Finding the real edge is the first half of this story; `perry compile
--print-hir` or the example's `perry/module-graph.sh` will name it.

## Rails shape to converge toward

Rails never loads generators from a boot. In
`vendor/rails/v8.0.2/railties/lib/rails/engine.rb:476`:

```ruby
def load_generators(app = self)
  require "rails/generators"
```

The `require` sits INSIDE `load_generators`, so nothing is loaded until
something calls it. `railties/lib/rails/application.rb` contains zero
`require "rails/generators"` — its `generators(&blk)` at `:377` only collects
configuration blocks. The eager requires live in the CLI commands that need
them, at the top of each file:
`railties/lib/rails/commands/generate/generate_command.rb:3`,
`.../destroy/destroy_command.rb:3`, `.../plugin/plugin_command.rb:41`.

Converged shape: the generator tree is reachable only from `trails <command>`
and from an explicit `loadGenerators()` call, never from the static graph of
`config/application.ts`. Whatever edge is found should become lazy or
type-only, matching the `load_generators` boundary rather than being special
cased.

## Acceptance criteria

- [ ] The edge from a production boot to
      `packages/trailties/src/generators/base.ts` is named in the PR body, with
      the tool output that found it.
- [ ] A production boot graph no longer reaches the generator tree, and a test
      asserts it rather than a comment claiming it — `production-boot.trails.test.ts`
      from #9495 is the place.
- [ ] `trails generate`, `trails destroy` and `trails new` still work, with
      their existing tests green.
- [ ] No `@blazetrails/thor` import is reachable from `config/application.ts`.
