---
title: "PERMITTED_SCALAR_TYPES is five types short, so params.permit drops uploaded files"
status: draft
updated: 2026-09-03
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: ["port-rack-test-uploaded-file"]
deps-rfc: []
est-loc: 250
priority: 12
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by a coverage pass over the rack-test scoping, and it is a behavioural
bug rather than a naming gap.

Rails' `ActionController::Parameters::PERMITTED_SCALAR_TYPES`
(`vendor/rails/actionpack/lib/action_controller/metal/strong_parameters.rb:1296-1312`)
is thirteen types:

```ruby
String, Symbol, NilClass, Numeric, TrueClass, FalseClass, Date, Time,
StringIO, IO, ActionDispatch::Http::UploadedFile, Rack::Test::UploadedFile
```

trails' equivalent is `isPermittedScalar`
(`packages/actionpack/src/action-controller/metal/strong-parameters.ts:72-77`),
the guard behind `permitted_scalar?` (`strong_parameters.rb:1314-1316`), and it
is four lines:

```ts
function isPermittedScalar(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  const t = typeof value;
  return t === "string" || t === "number" || t === "boolean";
}
```

That covers `String`/`Symbol`, `NilClass`, `Numeric`, `TrueClass`/`FalseClass`
and nothing else. **`Date`, `Time`, `StringIO`, `IO`,
`ActionDispatch::Http::UploadedFile` and `Rack::Test::UploadedFile` are all
missing**, so `params.permit(:avatar)` silently drops a file upload today —
`_permittedScalarFilter` (`:683-694`) never copies the value across, and the
caller gets a permitted hash with the key gone. Six call sites read the guard
(`:684`, `:693`, `:721`, `:998`, `:1038`, `:1053`), so the gap is not confined
to one path.

**Why it is filed here rather than folded into a collapse story.** One of the
six missing types is `Rack::Test::UploadedFile`, which is squarely this RFC's —
it is the third of the three actionpack call sites that named the gem
(`strong_parameters.rb:11,550,1311`) and the only one in production code rather
than test-support. But fixing only that entry would leave the list five types
wrong while looking converged, which is worse than leaving it whole: the next
reader sees a list that was deliberately touched and assumes the rest was
checked. So the story is the **whole list**.

`ActionDispatch::Http::UploadedFile` already exists at
`packages/actionpack/src/action-dispatch/http/upload.ts`;
`Rack::Test::UploadedFile` arrives with `port-rack-test-uploaded-file`, which is
this story's only dependency. `StringIO` is
`packages/ruby-compat/src/string-io.ts:20`. `Date` / `Time` need the trails
spelling for Ruby's `Date`/`Time` — check `docs/ruby-ts-conventions.md` and the
`date` package before inventing a check, and note that Rails' own comment at
`:1303-1304` says DateTimes are Dates and the redundant check is deliberately
omitted, so do not add one.

## Acceptance criteria

- [ ] `isPermittedScalar` accepts all thirteen types at
      `strong_parameters.rb:1296-1312`, in that order, including both
      `UploadedFile` classes.
- [ ] A test proves `params.permit` now _keeps_ an uploaded file where it
      previously dropped it, and it fails on the current implementation
      (a regression test that passes on baseline proves nothing).
- [ ] Rails' deliberate omission of a separate `DateTime` check
      (`strong_parameters.rb:1303-1304`) is preserved, not "fixed".
- [ ] `pnpm parity:api:calls` / `parity:api:calls:args` green with no new
      baseline rows; `parity:test` delta non-negative.

## Definition of done

Adding only the `Rack::Test::UploadedFile` entry, because that is the one this
RFC cares about, does not close this story — a half-converged list reads as a
checked one. Nor does widening the guard to `typeof value === "object"`, which
would admit every hash and array and invert what the filter is for.
