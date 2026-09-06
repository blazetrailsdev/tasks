---
title: "Ten ArgumentError raises lowered to a bare Error"
status: draft
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: bare-error-throws
packages: ["activerecord", "actiondispatch", "abstractcontroller", "actionview", "rack", "globalid"]
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

Surfaced by the RFC 0113 arm report's third verdict, `raise-class`
(`scripts/api-compare/report-arms.ts#ArmVerdict`): the two bodies' arm multisets
agree only once the raised CLASS is erased, so the port raises where Rails
raises but names a different error. That is RFC 0111's "same error class"
population, surfaced without a second extractor — the report's own doc comment
says so.

The whole verdict is **26 rows**, regenerable at any time with
`pnpm parity:api --calls && pnpm parity:api:arms:report`, under "Raise class
mismatches", which prints them as `Rails -> trails` pairs.

Two of the 26 are already filed — `verify-readonly-attribute-error-class`
(`ActiveRecordError -> ReadonlyAttributeError`) and
`rack-bounded-io-raises-emptycontent-not-eof` (`EOFError -> EmptyContentError`)
— and are NOT repeated here. The remaining 24 are split across four sibling
stories by family; this is one of them.

This verdict is advisory and stays that way. The RFC 0113 ratchet that landed in
trails#7554 gates only the missing-`throw` stratum — whether the port raises AT
ALL — never which class it raises. So nothing turns red while these sit here and
nothing turns green when they are fixed; the evidence is the Rails `file:line`.

## The rows

| divergence               | trails site                                                          | Rails site                                               |
| ------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------- |
| `ArgumentError -> Error` | `activerecord/connection-adapters/postgresql/oid/range.ts#castValue` | `connection_adapters/postgresql/oid/range.rb#cast_value` |
| `ArgumentError -> Error` | `activerecord/relation/batches.ts#actOnIgnoredOrder`                 | `relation/batches.rb#act_on_ignored_order`               |
| `ArgumentError -> Error` | `actiondispatch/journey/gtg/builder.ts#isNullable`                   | `journey/gtg/builder.rb#nullable?`                       |
| `ArgumentError -> Error` | `actiondispatch/journey/parser.ts#parseGroup`                        | `journey/parser.rb#parse_group`                          |
| `ArgumentError -> Error` | `actiondispatch/testing/request-encoder.ts#constructor`              | `testing/request_encoder.rb#initialize`                  |
| `ArgumentError -> Error` | `abstractcontroller/rendering.ts#_normalizeArgs`                     | `rendering.rb#_normalize_args`                           |
| `ArgumentError -> Error` | `actionview/renderer/abstract-renderer.ts#raiseInvalidIdentifier`    | `renderer/abstract_renderer.rb#raise_invalid_identifier` |
| `ArgumentError -> Error` | `actionview/renderer/abstract-renderer.ts#raiseInvalidOptionAs`      | `renderer/abstract_renderer.rb#raise_invalid_option_as`  |
| `ArgumentError -> Error` | `rack/builder.ts#run`                                                | `builder.rb#run`                                         |
| `ArgumentError -> Error` | `globalid/global-id.ts#modelClass`                                   | `global_id.rb#model_class`                               |

Ten sites where Rails raises `ArgumentError` and the port throws a bare JS
`Error`. Related but NOT the same as `argument-error-helper-returns-bare-error`
(that one is about `argumentError()` in `relation/query-methods.ts` returning a
name-stamped bare `Error`) or `batches-option-guards-raise-bare-error-not-argumenterror`
(the three `ensure_valid_options_for_batching!` guards). The `batches.ts` row
here is `act_on_ignored_order` (`relation/batches.rb`), a different method from
that story's three guards — check both before starting, since a shared
`ArgumentError` class landing for either may discharge several of these at once.

## Acceptance criteria

- [ ] Every row above raises the Rails class at the Rails site, with the Rails
      message string, per CLAUDE.md's "Same error class, same message string,
      same raise site".
- [ ] Where the ported class does not exist yet it is added in the file Rails
      declares it in, not re-declared module-locally — `one-shared-nomethoderror-class`
      records what that costs.
- [ ] `pnpm parity:api:arms:report` no longer lists these under "Raise class
      mismatches"; the verdict total drops by the number converged.
- [ ] No `eslint/rails-error-parity-exclude.json` row is widened to cover any of
      them.
