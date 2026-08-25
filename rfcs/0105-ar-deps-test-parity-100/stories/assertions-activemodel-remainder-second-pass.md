---
title: "assertions-activemodel-remainder-second-pass"
status: done
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6639
claim: "2026-08-17T10:01:56Z"
assignee: "assertions-activemodel-remainder-second-pass"
blocked-by: null
closed-reason: null
---

## Context

Sibling of `assertions-activemodel-attributes-and-types-remainder` (RFC 0105).
That story's PR converged `nested_error_test.rb`, `conversion_test.rb`,
`naming_test.rb` and `validations/i18n_generate_message_validation_test.rb` and
lowered `scripts/test-compare/assertion-mismatch-mark.json` for activemodel from
466/699/94 to 456/687/69. The rest of the three bundled clusters is still open.

Re-measure with:

    pnpm parity:test -- --assertions --missing --package activemodel

Still open (count/kind/value, measured after that PR):

| Rails test file                          | count | kind | value |
| ---------------------------------------- | ----: | ---: | ----: |
| `errors_test.rb`                         |    41 |   67 |     3 |
| `secure_password_test.rb`                |    27 |   40 |     0 |
| `serializers/json_serialization_test.rb` |    22 |   26 |     0 |
| `serialization_test.rb`                  |    14 |   15 |     0 |
| `error_test.rb`                          |     8 |   16 |     3 |
| `callbacks_test.rb`                      |     5 |    6 |     0 |
| `api_test.rb`                            |     4 |    6 |     1 |
| `model_test.rb`                          |     3 |    6 |     1 |
| `translation_test.rb`                    |     3 |    4 |    21 |
| `validations/i18n_validation_test.rb`    |    29 |   31 |     0 |
| `attribute_methods_test.rb`              |    15 |   18 |    11 |
| `attribute_test.rb`                      |    13 |   23 |     6 |
| `attribute_set_test.rb`                  |    15 |   23 |     4 |
| `attribute_registration_test.rb`         |    15 |   21 |     3 |
| `dirty_test.rb`                          |    15 |   21 |     1 |
| `attributes_dirty_test.rb`               |    13 |   18 |     1 |
| `type/integer_test.rb`                   |     8 |   12 |     2 |
| `attributes_test.rb`                     |     7 |   10 |     1 |
| `attribute_assignment_test.rb`           |     5 |    7 |     1 |
| `type/decimal_test.rb`                   |     5 |    8 |     0 |
| `type/serialize_cast_value_test.rb`      |     0 |   10 |     1 |
| `type/date_time_test.rb`                 |     3 |    3 |     1 |

`translation_test.rb` is a full rewrite: our test file asserts entirely
invented values (`"First name"`, `"Nested attribute"`) where Rails asserts
i18n-loaded ones (`"person name attribute"`, `"Person Address Street"`) —
`vendor/rails/activemodel/test/cases/translation_test.rb` sets up
`I18n.backend.store_translations` per test against `models/person.rb`
(`Person`, `Person::Gender`, `Child`).

The four port-blocked files called out in the parent story
(`type/binary_test.rb`, `type/float_test.rb`, `type/registry_test.rb` +
`type_test.rb`, `access_test.rb`) are still blocked — see that story for the
Rails `file:line` for each.

## Acceptance criteria

- Each file taken on reports 0 assertion-count / -kind / -value mismatches in
  `pnpm parity:test -- --assertions --package activemodel`.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered by exactly this
  story's contribution; never raised.
- No test name changes; `pnpm parity:test` percent for activemodel does not drop.
- No new rows in `scripts/parity/unported-files/`.
- Ship what fits one PR and file the rest as a further sibling story.
