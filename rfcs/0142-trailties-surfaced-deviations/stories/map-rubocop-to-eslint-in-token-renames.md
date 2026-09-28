---
title: "Map `rubocop` → `eslint` in the parity token renames"
status: done
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: generators
packages:
  - trailties
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: trails#8197
claim: "2026-09-27T22:39:57Z"
assignee: "map-rubocop-to-eslint-in-token-renames"
blocked-by: null
closed-reason: null
---

## Context

Rails runs RuboCop from its own code: `config.generators.apply_rubocop_autocorrect_after_generate!`
(`vendor/rails/v8.0.2/railties/lib/rails/configuration.rb:134-139`), the
`:skip_rubocop` class option and `skip_rubocop?`
(`generators/app_base.rb:100,392-393`), `def rubocop` / `create_rubocop_file` /
`build(:rubocop)` (`generators/rails/app/app_generator.rb:92-93,393-395`), and the
`bin/rubocop.tt` / `rubocop.yml.tt` templates. trails has no RuboCop and never
will — its analogue is ESLint, which the repo already runs as its own linter.

`scripts/parity/conventions.ts` already has the mechanism for exactly this: a
`TOKEN_RENAMES` table whose only current entry is `erb` → `tse` (plus the `ERB` /
`Erb` casings, `:36-44`). It fires on an underscore-token boundary
(`TOKEN_RENAME_PATTERN`, `:92`), reaches file paths as well as member names
(`FILE_TOKEN_RENAME_PATTERN`, `:101` — added because renames used to miss paths),
and applies to test names too, so both sides of `parity:test` normalize to one
key. `docs/ruby-ts-conventions.md` is generated from that file and is what
`parity:api` matches on, so the table is the only correct seat for this — a
hand-picked TS name that the table does not produce is a bug, not a preference.

Adding `rubocop: "eslint"` makes the whole surface credit at the name a trails dev
would write:

| Ruby                                        | TS                                                              |
| ------------------------------------------- | --------------------------------------------------------------- |
| `apply_rubocop_autocorrect_after_generate!` | `applyEslintAutocorrectAfterGenerateBang`                       |
| `skip_rubocop?`                             | the `Skip` union's `Eslint` arm (`generators/app-base.ts:5-18`) |
| `create_rubocop_file`                       | `createEslintFile`                                              |
| `rubocop` (the `build(:rubocop)` action)    | `eslint`                                                        |
| `templates/rubocop.yml.tt`                  | the generated ESLint config                                     |
| `bin/rubocop.tt`                            | `bin/eslint`                                                    |

This story is the mapping only. The behaviour ports are
`port-apply-rubocop-autocorrect-after-generate`,
`app-generator-writes-an-eslint-config-instead-of-rubocop-yml`,
`app-base-declares-a-skip-eslint-class-option` and
`generated-ci-and-manifest-run-eslint-not-rubocop`.

Note `rails/generators/rails/plugin/plugin_generator.rb:75-76,133,182,257-259`
carries the identical surface and is unported; it credits through the same table
whenever a plugin generator is ported, with no second entry.

## Acceptance criteria

- `TOKEN_RENAMES` gains `rubocop: "eslint"` plus the casings the table's own
  pattern needs (`RuboCop`, `Rubocop` — Rails spells the constant `RuboCop`), each
  verified against `TOKEN_RENAME_PATTERN`'s `(^|_)tok(?=_|$|[A-Z])` boundary.
- The alternation is longest-key-first as the existing comment requires (`:84`), so
  no shorter key can shadow `rubocop`.
- `docs/ruby-ts-conventions.md` is regenerated from `conventions.ts`, never
  hand-edited, and the regeneration is the whole doc diff.
- A `scripts/parity` unit test covers each row of the table above, including the
  file-path arm (`templates/rubocop.yml.tt`) and a name where the token must NOT
  fire (no bare substring match).
- `pnpm parity:api` and `pnpm parity:test` deltas are non-negative; the PR body
  records whether any Ruby name newly credits or newly reports as missing, since
  this rename changes which TS name the comparer looks for.
- No TS name is renamed in this story — nothing in trails spells `rubocop` today
  outside two `# rubocop:disable Security/Eval` directives in our own Ruby scripts
  (`scripts/parity/pipeline/query/ruby/{dump,ar_dump}.rb`), which are Ruby that
  RuboCop would lint and are out of scope.
