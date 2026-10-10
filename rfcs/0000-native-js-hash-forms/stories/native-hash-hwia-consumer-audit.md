---
title: "Audit the 20 HashWithIndifferentAccess consumers against what Rails passes"
status: draft
updated: 2026-10-10
rfc: "0000-native-js-hash-forms"
cluster: carrier-audit
packages: [activesupport, activemodel, activerecord, actionpack, trailties]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruling (repo owner, 2026-10-10): `ActiveSupport::HashWithIndifferentAccess` is
a faithful Rails class and its port is not changed. What is audited is who
uses it: a consumer should hold an HWIA only where Rails does.

`grep -rln HashWithIndifferentAccess packages/*/src --include=*.ts | grep -v
'\.test\.ts'` lists 20 files at trails `ddd629745a`. A first pass while
writing the RFC checked every CONSTRUCTION site (`new HashWithIndifferentAccess`
/ `withIndifferentAccess(`) against Rails `v8.0.2` and found each one backed:

| trails                                                                            | Rails                                                                                                | Verdict                                                                                       |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `actionpack/src/action-controller/metal/http-authentication.ts:295`               | `action_controller/metal/http_authentication.rb:268` `ActiveSupport::HashWithIndifferentAccess[...]` | earned                                                                                        |
| `http-authentication.ts:416`                                                      | `http_authentication.rb:498` `Hash[params].with_indifferent_access`                                  | earned                                                                                        |
| `actionpack/src/action-controller/metal/strong-parameters.ts:180,338,367,572,576` | `strong_parameters.rb` `@parameters = parameters.with_indifferent_access` and its siblings           | earned; check each of the five against its own line                                           |
| `activemodel/src/access.ts:10`                                                    | `active_model/access.rb:9` `.with_indifferent_access`                                                | earned                                                                                        |
| `activemodel/src/attribute-mutation-tracker.ts:44,54`                             | `attribute_mutation_tracker.rb:19,27` `{}.with_indifferent_access`                                   | earned                                                                                        |
| `activerecord/src/enum.ts:222`                                                    | `active_record/enum.rb:227`                                                                          | earned                                                                                        |
| `activerecord/src/store.ts:304,306`                                               | `active_record/store.rb:287,289`                                                                     | earned                                                                                        |
| `activesupport/src/message-pack/extensions.ts:355`                                | `active_support/message_pack/extensions.rb:242` `HashWithIndifferentAccess.new(unpacker.read)`       | earned                                                                                        |
| `activesupport/src/parameter-filter.ts:125`                                       | `active_support/parameter_filter.rb:126` `params.class.new`                                          | earned: built only under an `instanceof` guard, so the class follows the input as Rails' does |
| `trailties/src/thor/parser/options.ts:200`                                        | `Thor::CoreExt::HashWithIndifferentAccess.new(@assigns)` in thor's `parser/options.rb`               | earned, and it is Thor's class, not ActiveSupport's                                           |

Not yet checked, and the substance of this story, are the files that only NAME
the type (a declared return, a parameter, an `instanceof`):
`activemodel/src/dirty.ts:90,94`,
`activerecord/src/attribute-methods/dirty.ts:97,105`,
`activerecord/src/base.ts:1045,1949,1951,2012`,
`activerecord/src/test-helpers/models/admin/user.ts:30-33`,
`trailties/src/thor/base.ts:96`, `ruby-compat/src/rb-equal.ts`, and the
plumbing (`activesupport/src/index.ts`, `namespaces.ts`,
`core-ext/hash/indifferent-access.ts`,
`trailties/src/thor/core-ext/hash-with-indifferent-access.ts`, and the class
file itself).

## Acceptance criteria

- [ ] A table with one row per file of the 20 (re-run the grep; use the new
      list if it moved), giving for each reference the Rails `file:line` and a
      verdict: **earned** (Rails holds an HWIA there), **plumbing** (the class,
      its export, its namespace seat, its `with_indifferent_access` core-ext),
      or **unearned** (Rails passes a plain `Hash`).
- [ ] Every row above is re-verified at its exact Rails line rather than taken
      from this story, and the thor row gets its upstream line (thor is not vendored in trails).
- [ ] `base.ts:1045`: identify the member and the Rails method it types
      (`static definedEnums`, a record of HWIAs; `enum.rb:86` documents the mapping as one) and
      confirm.
- [ ] `admin/user.ts:30-33`: confirm against
      `activerecord/test/models/admin/user.rb` that each of `configs`,
      `params`, `settings`, `spouse` is a `store` whose coder yields an HWIA
      (`store.rb:256-289`), and that the ones declared with a non-indifferent
      coder are not typed as one.
- [ ] For each **unearned** row, a story filed with
      `pnpm tasks new <this RFC> <slug> --body-file <path>` carrying the trails
      and Rails `file:line` and what the consumer should hold instead. If
      there are none, say so in the audit and close the story with the table.
- [ ] The class `packages/activesupport/src/hash-with-indifferent-access.ts`
      is not edited.

## Definition of done

The deliverable is the table and any stories it files. A code change to an HWIA
consumer belongs to the story the audit files for it, not to this one.

## Notes

Deliver the table with the `/audit-report` skill, or in the closing PR's body
if a code change accompanies it.
