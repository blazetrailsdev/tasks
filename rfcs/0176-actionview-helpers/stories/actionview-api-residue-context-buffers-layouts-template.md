---
title: "actionview-api-residue-context-buffers-layouts-template"
status: ready
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After the render-parser register rows, the Placeholderable inlining, the
`test_case.rb` members and the controller delegators, actionview's remaining
API gap (`pnpm parity:api`, forced run 2026-10-20) is **19 methods across 8
ported files**:

| Ruby file                  | missing | names                                                         |
| -------------------------- | ------- | ------------------------------------------------------------- |
| `context.rb`               | 4       | `outputBuffer`, `outputBuffer=`, `viewFlow`, `viewFlow=`      |
| `buffers.rb`               | 3       | `encoding`, `encodeBang`, `forceEncoding`                     |
| `layouts.rb`               | 3       | `actionHasLayout`, `is_conditionalLayout`, `is_includeLayout` |
| `template.rb`              | 3       | `findNodeById`, `offset`, `localsCode`                        |
| `lookup_context.rb`        | 2       | `isTemplateExists`, `isAnyTemplates`                          |
| `rendering.rb`             | 2       | `_helpers`, `eagerLoadBang`                                   |
| `path_set.rb`              | 1       | `each`                                                        |
| `template/handlers/erb.rb` | 1       | `validEncoding`                                               |

Three of these are already ruled on and want a receipt rather than a port:
`buffers.rb`'s `encoding` / `forceEncoding` and `handlers/erb.rb`'s
`validEncoding` are the encoding-tag surface root CLAUDE.md
§ "A String has no encoding tag either" rules out. `template.rb`'s `offset` and
`localsCode` belong to the precompilation seam in § "Templates are
precompiled", and `findNodeById` is next to `spot`, which that section pins as
line-based.

The rest look like real ports or credit bugs: the `context.rb` accessor pairs
(cf. the `test_case.rb` pair shape), `layouts.rb`'s two predicates — note
`is_conditionalLayout` is a malformed spelling, not the convention
`isConditionalLayout` — `lookup_context.rb`'s two predicates,
`rendering.rb`'s `_helpers` / `eagerLoadBang`, and `path_set.rb#each`.

## Acceptance criteria

- Each of the 19 is ported at its Rails name, or receipted against the
  ratified section that rules it out, with the section named at the
  declaration.
- The `is_conditionalLayout` / `is_includeLayout` spellings are reconciled
  against `docs/ruby-ts-conventions.md` — whichever side is wrong gets fixed
  there, not worked around.
- `pnpm parity:api --package actionview` shows these 8 files at 0 missing, and
  `pnpm parity:api:predicates` stays green.
- At 300 loc this may not fit one PR: split by file, each PR from `main`, and
  file the remainder.
