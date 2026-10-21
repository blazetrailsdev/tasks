---
title: "Drop the generator's codegen-runtime and codegen-declined shims from marcel"
status: done
updated: 2026-10-21
rfc: "0201-marcel-port-to-100"
cluster: marcel-polish
packages: ["marcel"]
deps: ["marcel-land-on-main"]
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9188
claim: "2026-10-21T20:16:54Z"
assignee: "marcel-land-on-main"
blocked-by: null
---

## Context

`packages/marcel/src/codegen-runtime.ts` and `codegen-declined.ts` are
generator artifacts; a hand port ships neither. `codegen-runtime.ts` is
imported once, by `magic.ts:3`, for `rbBinop` at `magic.ts:145`:

```ts
x = io.read(
  rbBinop(rbBinop(offset.end, "-", offset.begin), "+", rbStrSend(value, "bytesize")[0]),
  buffer,
);
```

which is `io.read(offset.end - offset.begin + value.bytesize, buffer)` in
`vendor/marcel/v1.0.4/lib/marcel/magic.rb` (`magic_match_io`), with `offset` a
Range of Integers. `codegen-declined.ts` is reached only from the skipped
`Rack::Lint::InputWrapper` test body in `mime-type.test.ts`.

## Acceptance criteria

- `magic.ts` writes the arithmetic natively on typed Range bounds and imports
  nothing from `codegen-runtime.js`.
- The skipped InputWrapper test keeps its Ruby body without `declined(...)`
  (it is `it.skip`, so it need not resolve the rack 2 constant at run time),
  and its `PERMANENT-SKIP:` line stays.
- Both shim files are deleted; the test count is unchanged.
