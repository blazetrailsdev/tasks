---
title: "activesupport-empty-predicate-call-rows"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: 6683
claim: "2026-08-18T00:44:19Z"
assignee: "converge-collection-target-setter-coercion-and-proxy"
blocked-by: null
closed-reason: null
---

## Context

`ruby-empty-predicate-has-no-ts-call-spelling` (PR for the
call-mismatches-partial-regen bundle) added `isEmpty` — the TS call spelling for
Ruby `Array#empty?` / `Hash#empty?` / `String#empty?` — and converged the five
activerecord `empty?` call-set rows with it. The helper lives at
`packages/activerecord/src/ruby-empty.ts` (next to `ruby-truthy.ts`), NOT in
activesupport, for a measured reason: the call-set comparator resolves a Ruby
call name against the ported names of the package the body is in, so exporting
`isEmpty` from `@blazetrails/activesupport` immediately surfaced EIGHT
pre-existing activesupport divergences as NEW gate rows:

```text
activesupport  cache.ts                     merged_options                 empty?
activesupport  cache/file-store.ts          delete_empty_directories       empty?
activesupport  core-ext/tse/util.ts         tokenize                       empty?
activesupport  duration.ts                  sum                            empty?
activesupport  inflector/inflections.ts     define_acronym_regex_patterns  empty?
activesupport  json/encoding.ts             encode                         empty?
activesupport  tagged-logging.ts            format_message                 empty?
activesupport  testing/time-helpers.ts      stubbed?                       empty?
```

Each is a Ruby `empty?` the TS body spells as a property read (`xs.length === 0`
/ `Object.keys(h).length === 0`), i.e. the same class the activerecord rows
were. They are real, and none of them is baselined today — the bundle PR did not
widen the exclude tree for them, which is why the helper was placed in
activerecord instead.

## Acceptance criteria

- [ ] Move (or re-export) the `isEmpty` helper so activesupport bodies can call
      it — the natural home is activesupport itself, per the original
      `ruby-empty-predicate-has-no-ts-call-spelling` story.
- [ ] Converge all eight sites above to call it, each verified against its
      Rails `file:line`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green with NO new
      baseline rows; `pnpm parity:api:extra` does not grow.
- [ ] Delete `ruby-empty.ts`'s note about the eight, or update it, once the
      placement changes.
