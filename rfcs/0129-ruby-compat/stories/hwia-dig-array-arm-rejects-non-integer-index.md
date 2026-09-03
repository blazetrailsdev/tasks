---
title: "hwia-dig-array-arm-rejects-non-integer-index"
status: draft
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`HashWithIndifferentAccess#dig`
(`packages/activesupport/src/hash-with-indifferent-access.ts:616-633`) walks
`rb_obj_dig` (`vendor/ruby/object.c:3906`), and its Array arm coerces the
identifier:

```ts
      if (Array.isArray(obj)) {
        const index = Number(identifier);
        obj = obj[index < 0 ? obj.length + index : index];
        continue;
      }
```

Ruby's Array arm is `rb_ary_at` (`object.c:3920-3923`), whose index goes
through `NUM2LONG` (`vendor/ruby/array.c:1881-1883`). A String is not
implicitly converted there — MRI:

```console
$ ruby -e '{a: [1]}.dig(:a, "0")'
TypeError: no implicit conversion of String into Integer
```

So `h.dig("a", "0")` returns element 0 in trails where Rails raises. The
identical gap was flagged in review on PR #7437 and fixed in
`OrderedOptions#dig` (`packages/activesupport/src/ordered-options.ts`), whose
walk is the same shape and should be spelled the same way; this story converges
the `HashWithIndifferentAccess` twin, which is the one with call sites outside
its own tests.

## Acceptance criteria

- `HashWithIndifferentAccess#dig`'s Array arm raises
  `TypeError: no implicit conversion of <class> into Integer` for a
  non-Integer identifier, matching `NUM2LONG`, rather than coercing it.
- A regression test per arm that fails on the baseline, in
  `hash-with-indifferent-access.trails.test.ts` beside the existing
  `it("dig with array")` cover, which keeps its name and keeps passing.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args` show no new
  rows; activesupport green.
