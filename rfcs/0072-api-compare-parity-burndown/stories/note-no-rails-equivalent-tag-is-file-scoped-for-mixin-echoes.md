---
title: "Record that @noRailsEquivalent is file-scoped, so mixin echoes on base.ts survive their home-file story"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6143
claim: "2026-08-05T20:53:11Z"
assignee: "pg-schema-statements-abstract-signature-divergences"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `extra-surface-base-accessors-classify` (PR #5919), which took
`packages/activerecord/src/base.ts` from 20 novel extras to 12.

Six of the remaining 12 are not `base.ts`'s own inventions — they are
`declare static X: typeof Module.X` mixin echoes whose implementation, and whose
burndown finding, live in another file:

| base.ts                        | home file (own novel count)                                                    | Rails                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `adapterClassSync` :1565       | `connection-handling.ts` (1), `database-configurations/database-config.ts` (3) | `def adapter_class`, `connection_handling.rb:338`                                            |
| `validatesUniqueness` :3408    | `validations.ts` (1), `validations/uniqueness.ts` (1)                          | `def validates_uniqueness_of`, `uniqueness.rb:291`                                           |
| `withCte` :2868                | `querying.ts` (1)                                                              | `def with` (delegated); `base.ts:2869` already declares the faithful `with` alias next to it |
| `attributeNamesList` :4190     | `attribute-methods.ts` (1)                                                     | `def attribute_names` (instance), `attribute_methods.rb:334`                                 |
| `isEqual` :4457                | `core.ts` (2)                                                                  | `def ==`, `core.rb:631`                                                                      |
| `loadBelongsTo` / `loadHasOne` | `associations/instance-methods.ts` (2)                                         | none (see #5919)                                                                             |

PR #5919 recorded these as "owned by the home file — no new story", on the
reasoning that fixing the home fixes `base.ts` in lockstep. That reasoning is
only half right, and the gap is worth writing down:

- For a **rename** it holds: `declare static X: typeof Module.X` stops
  compiling when `Module.X` is renamed, so `tsc` forces the base.ts edit.
- For a **`@noRailsEquivalent` tag** it does **not** hold. The tag is keyed by
  the CONTAINER's file (`allowKeyOf`, `extra-surface.ts:329`), so tagging the
  home declaration allows it only in the home file. The `base.ts` echo keeps
  reporting as novel, and the home-file story will close believing the name is
  done.

So a home-file agent who resolves its name by tagging rather than renaming will
silently leave `base.ts`'s count untouched, and nothing in either story says so.

Note `isEqual` and `loadBelongsTo`/`loadHasOne` were tagged on `base.ts` in
PR #5919 (they are irreducible), so their home files are the mirror image of this
same problem.

## Acceptance criteria

- Add a note to the RFC 0072 burndown guidance (or the relevant story bodies)
  stating that a `@noRailsEquivalent` tag is file-scoped: a name re-declared as
  a mixin echo needs the tag in **every** file that declares it, and the home
  file's story is not sufficient on its own.
- Cite `allowKeyOf` (`scripts/api-compare/extra-surface.ts:329`) and the
  keying note above it as the mechanism.
- Cross-reference the six names above from the home-file stories so an agent
  claiming one knows to check `base.ts`.
- No production code change is required by this story; it is a
  tracking/guidance fix. If it turns out the cleanest fix is instead to teach
  `extra-surface.ts` to follow `typeof Module.X` echoes back to their home,
  scope that as a separate tooling story rather than widening this one.
