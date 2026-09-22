---
title: "Converge-and-park the 33 activerecord rows waiting on 0155 stories"
status: ready
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: assertion-parity
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Measured 2026-09-22 on trails `main` @ `249bf232`
(`pnpm parity:test -- --package activerecord --assertions --missing`):
activerecord reads 40 count / 101 kind / 2 value. 110 of those 143 rows are
`has_many_associations_test.rb` and belong to
`assertions-has-many-associations-remainder-7` and its successors. The other
**33 rows sit in eight small files that no 0132 story owns**, because each was
handed to a 0155 production-bug story — and then left running unconverged
instead of being parked the way this RFC's "a converged assertion that fails is
a story, not a detour" section requires. A pending test leaves all three
counters (`scripts/test-compare/compare.ts:526-560`); a running test with a
divergent body does not. So these rows will not fall until either the 0155 fix
lands, or someone does the parking pass this story is.

The rows, by Rails file, with the trails file and the story each is waiting on:

| Rails test                                                                                                                                                                                                                                                                           | rows | trails file                                                                | waiting on                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---: | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `attribute_methods_test.rb` — `attribute keys on a new instance`, `non-attribute read and write`, `undeclared attribute method does not affect respond_to? and method_missing`, `attribute readers/writers/predicates respect access control`, `bulk updates respect access control` |   14 | `packages/activerecord/src/attribute-methods.test.ts` (`:127`, `:1696` …)  | 0155 `activerecord-class-level-attribute-method-predicate-strips-equals-suffix`, `generate-members-for-result-set-only-attributes`, `activemodel-respond-to-cannot-hide-private-methods` — the access-control set needs `raises` on private readers, which none of the three names exactly; establish which story owns each, or file one |
| `scoping/default_scoping_test.rb` — `unscope errors with non where hash keys`, `unscope errors with non symbol or hash arguments`                                                                                                                                                    |    4 | `packages/activerecord/src/scoping/default-scoping.test.ts`                | 0155 `unscope-symbol-vs-string-raising-arms`                                                                                                                                                                                                                                                                                             |
| `active_record_schema_test.rb` — `schema without version is the current version schema`, `schema version accessor`                                                                                                                                                                   |    4 | `packages/activerecord/src/active-record-schema.test.ts:73`                | **no story** — file it                                                                                                                                                                                                                                                                                                                   |
| `associations/belongs_to_associations_test.rb` `async load belongs to`; `associations/has_one_associations_test.rb` `async load has one`                                                                                                                                             |    4 | `belongs-to-associations.test.ts`, `has-one-associations.test.ts`          | 0155 `association-async-load-target-uses-async-executor`                                                                                                                                                                                                                                                                                 |
| `batches_test.rb` — `each should not return query chain and execute only one query`                                                                                                                                                                                                  |    2 | `packages/activerecord/src/batches.test.ts`                                | 0155 `find-each-find-in-batches-block-arm`                                                                                                                                                                                                                                                                                               |
| `adapters/postgresql/postgresql_adapter_test.rb` — `ignores warnings when behaviour ignore`                                                                                                                                                                                          |    2 | `packages/activerecord/src/adapters/postgresql/postgresql-adapter.test.ts` | 0155 `pg-ignores-warnings-test-match-assertion`                                                                                                                                                                                                                                                                                          |

`activesupport`'s residue (`multibyte_chars_test.rb` 99 rows, `string_ext_test.rb` 7) is **not** this story: 0155 `assertions-activesupport-multibyte-chars-remainder`
is live convergence work on those bodies, not a parked bug.

## Acceptance criteria

- For each row in the table: the trails body is converged to the Rails
  assertions (same count, kinds, expected values, against `vendor/rails`), and
  then either it passes and stays running, or it fails and is parked as
  `it.skip` with one `// BLOCKED: <story-slug>` line — inside any existing
  adapter gate wrapper, never replacing it (`gates.ts:410-424`).
- Every `BLOCKED:` slug names a story that exists and states the production
  symbol. Where the table says "establish which" or "no story", the story is
  found or filed in 0155 (`pnpm tasks new 0155-assertion-surfaced-port-bugs …`)
  with the trails and Rails `file:line`, before the test is parked.
- No test is parked with an unconverged body, and no assertion is softened or
  deleted to make a test pass.
- After the PR, `pnpm parity:test -- --package activerecord --assertions`
  reports zero rows outside `associations/has_many_associations_test.rb`, and
  the name gate still reads 8572/8572 — parking does not move it
  (`compare.ts:920-928`).

## Definition of done

Parking the 33 rows without first converging their bodies does not close this
story — that is the "parking to avoid the work" the RFC README forbids. Fixing
the underlying production bugs here does not close it either; those belong to
the 0155 stories named above.

## Verification

```sh
pnpm parity:test -- --package activerecord --assertions --missing \
  | sed -n '/ASSERTION COUNT MISMATCHES/,$p' | grep -oE '^\s+\S+_test\.rb' | sort | uniq -c
# only associations/has_many_associations_test.rb remains
pnpm parity:test -- --package activerecord | grep -E '^\s*Overall'   # 8572/8572 name gate unchanged
pnpm eslint packages/activerecord/src --rule 'blazetrails/no-freeform-comments: error'
```

## Notes

- The freeze marker (`scripts/test-compare/assertion-mismatch-mark.freeze`) is
  still up: do not reseed the mark, and do not hand-edit it.
- `has_many_associations_test.rb` is deliberately excluded so this PR does not
  collide with `assertions-has-many-associations-remainder-7` (trails#7957).
- Once this and the has_many remainders land, activerecord reads 0/0/0 and
  `flip-assertion-mismatch-gate-to-hard-zero` /
  `tighten-assertion-mark-after-0132` can move.
