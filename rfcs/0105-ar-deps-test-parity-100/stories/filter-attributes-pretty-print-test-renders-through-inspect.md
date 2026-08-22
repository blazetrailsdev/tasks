---
title: "filter_attributes pretty_print test renders through inspect(), not the ported PrettyPrinter"
status: ready
updated: 2026-08-22
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced on PR #6847 while converging `filter_attributes_test.rb`'s assertion
tail. It is the one assertion-VALUE row left in that file:

```text
filter_attributes_test.rb › filter_attributes on pretty_print should handle [FILTERED] value properly
  includes rails [s:auth_token: [FILTERED], s:token: [FILTERED]]
       vs trails [s:auth_token: [FILTERED], s:token: "[FILTERED]"]
```

Rails has two sibling tests over the same fixture
(`vendor/rails/activerecord/test/cases/filter_attributes_test.rb`):

- `:106-114` "filter_attributes should handle [FILTERED] value properly" reads
  `user.inspect` and asserts `'token: "[FILTERED]"'` — **quoted**, because
  `token` is not filtered and `attribute_for_inspect` renders a String through
  `#inspect`.
- `:135-145` "filter_attributes on pretty_print should handle [FILTERED] value
  properly" renders through `PP.pp(user, StringIO.new(actual))` and asserts
  `"token: [FILTERED]"` — **unquoted**.

The trails port of the second test renders through `inspect()` rather than a
pretty-printer, and copied the _first_ test's quoted literal
(`packages/activerecord/src/filter-attributes.test.ts:152-158`), so the expected
value diverges from Rails' even though the test passes.

Note the Rails literal is unquoted only because `"token: [FILTERED]"` is a
substring of the `auth_token: [FILTERED]` line the same output already carries —
it is not a claim that `token` renders unquoted under PP. Asserting Rails'
literal verbatim is therefore correct _and_ passes.

trails already has the machinery this test should use: `prettyPrint` on `Base`
(`packages/activerecord/src/core.ts:113`, `base.ts:4717`) and a `PrettyPrinter`
(`packages/activerecord/src/pretty-print.ts`), the ports of `core.rb:798-818`
and Ruby's `PP`.

## Converged shape

In `packages/activerecord/src/filter-attributes.test.ts`, the three
`filter_attributes on pretty_print*` tests render through `prettyPrint` /
`PrettyPrinter` (the `PP.pp(user, StringIO.new(actual))` port) instead of
`inspect()`, and assert Rails' literals verbatim:

```ts
expect(output).toContain("auth_token: [FILTERED]");
expect(output).toContain("token: [FILTERED]");
```

## Acceptance criteria

- `filter_attributes_test.rb` reports 0 assertion-count, 0 assertion-kind and
  0 assertion-value mismatches in
  `pnpm parity:test -- --assertions --package activerecord`.
- The `filter_attributes on pretty_print*` tests render through the ported
  `prettyPrint`/`PrettyPrinter`, not `inspect()`.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered on a passing run
  (activerecord value is at 38); never hand-edited upward.
- No test name changes.
