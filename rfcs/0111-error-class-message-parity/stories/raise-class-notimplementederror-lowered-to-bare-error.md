---
title: "Six NotImplementedError raises lowered to a bare Error"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: bare-error-throws
packages: ["activerecord", "actionview"]
deps: []
deps-rfc: []
est-loc: 90
priority: 20
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

| divergence                     | trails site                                                                          | Rails site                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `NotImplementedError -> Error` | `activerecord/associations/builder/association.ts#macro`                             | `associations/builder/association.rb#macro`                               |
| `NotImplementedError -> Error` | `activerecord/associations/builder/association.ts#validDependentOptions`             | `associations/builder/association.rb#valid_dependent_options`             |
| `NotImplementedError -> Error` | `activerecord/associations/collection-association.ts#deleteRecords`                  | `associations/collection_association.rb#delete_records`                   |
| `NotImplementedError -> Error` | `activerecord/connection-adapters/abstract/schema-statements.ts#changeTableComment`  | `connection_adapters/abstract/schema_statements.rb#change_table_comment`  |
| `NotImplementedError -> Error` | `activerecord/connection-adapters/abstract/schema-statements.ts#changeColumnComment` | `connection_adapters/abstract/schema_statements.rb#change_column_comment` |
| `NotImplementedError -> Error` | `actionview/template/resolver.ts#findTemplates`                                      | `template/resolver.rb#find_templates`                                     |

Six abstract / must-override methods where Rails raises `NotImplementedError`
and the port throws a bare JS `Error`. `singular-association-replace-should-raise-not-implemented`
is the same family at a different site (`SingularAssociation#replace`) and is
already filed; it is not repeated here.

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
