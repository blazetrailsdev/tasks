---
title: "trails-tsc: map a .tse diagnostic's end through the source map, not the shim span length"
status: ready
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`remapTseDiagnostic` (`packages/activerecord-cli/src/tsc-wrapper/ar-program.ts`, PR #8296) maps a compiled view's diagnostic start through the shim's source map. But it forces the end onto the start line, at `character + (d.end - d.pos)`. That is a length in shim text, so a span that crosses lines, or that sits in re-emitted code (the `context.yield` rewrite), gets a wrong end in the `.tse` file.

`decodeLineMappings` (`packages/tse-compiler/src/source-map.ts`) also keeps only the first segment of each generated line.

There is no Rails counterpart. Rails' own ERB location translation maps both ends of a span by token offset (`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers/erb.rb:42-55,128-141`).

## Converged shape

- Map `endPosition` through the same line map as the start, using the end's own generated line and column.
- `decodeLineMappings` returns every segment.
- `lineMappings` in `packages/trails-tsc/src/plugins/tse.ts` emits a second segment where the emitted code ends, so a column past that point clamps to the end of the tag instead of running into the glue after it.

## Acceptance criteria

- [ ] A diagnostic spanning two lines of a multi-line `<% %>` tag reports the right start and end in the `.tse` file.
- [ ] A diagnostic inside `<%= yield(123) %>` underlines `123` only.
- [ ] Tests in `packages/activerecord-cli/src/tsc-wrapper/cli.test.ts` and `packages/tse-compiler/src/source-map.test.ts`.
