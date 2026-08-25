---
title: "converge XmlMini._parse_file onto a StringIO shim instead of a Blob"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6451
claim: "2026-08-13T01:56:51Z"
assignee: "database-version-sync-getter-forces-hand-warms"
blocked-by: null
closed-reason: null
---

## Context

Shipped as a deviation in PR #6441 (`port-xml-mini-backend-and-parsing-half`).

`XmlMini._parse_file` returns an IO:

```ruby
# activesupport/lib/active_support/xml_mini.rb:180-186
def _parse_file(file, entity)
  f = StringIO.new(::Base64.decode64(file))
  f.extend(FileLike)
  f.original_filename = entity["name"]
  f.content_type = entity["content_type"]
  f
end
```

`packages/activesupport/src/xml-mini.ts:491` returns a `Blob` instead, because
trails has no `StringIO`:

```ts
const f = new Blob([Uint8Array.from(decode64(file), (c) => c.charCodeAt(0))]);
```

Two things are wrong with it, and neither is a TypeScript language shortcoming:

1. **No `read`.** Rails hands callers an IO — `Hash.from_xml`'s consumers (and
   every Rails app treating an uploaded-file node as an `ActionDispatch::Http::
UploadedFile` lookalike) call `#read`. `Blob` offers `.text()`/
   `.arrayBuffer()`, both async, so no ported caller can read it the way Rails
   does.
2. **The Latin-1 round-trip is a smell.** `decode64` returns a binary string, so
   the bytes have to be re-widened with `Uint8Array.from(..., charCodeAt)` to
   stop `Blob` re-encoding them as UTF-8. A StringIO over the binary string needs
   none of that.

A `StringIO` shim already exists twice in the repo, both private:
`packages/rack/src/mock-request.ts:44` and
`packages/website/src/lib/frontiers/rack-bridge.ts`. rack depends on
activesupport, so the shared one belongs on the activesupport side and rack's
copy should collapse onto it.

## Converged shape

Port a Ruby-`StringIO`-shaped reader (`read`, `rewind`, `string`, `size`,
`eof?`) as a Ruby-stdlib shim, have `_parseFile` return
`StringIO.new(decode64(file))` extended with `FileLike`, and drop the
`Uint8Array.from(...charCodeAt)` widening. Point `packages/rack/src/mock-request.ts`
at it so there is one StringIO.

Check first whether a shim like this has a settled home: if trails has no
Ruby-stdlib shim directory, decide that placement as part of this story rather
than inventing a fourth private copy.

## Acceptance criteria

- `_parseFile` returns a StringIO-shaped object with a synchronous `read`, still
  decorated via `Object.defineProperties(... FileLike)` (Ruby `extend` decorates
  the instance, not a class).
- The Latin-1 re-widening is gone; `decode64`'s binary string is handed over
  as-is.
- `packages/rack/src/mock-request.ts` uses the shared StringIO instead of its
  local `class StringIO`.
- `xml-mini.trails.test.ts`'s `_parse_file` tests assert through `read` rather
  than `await file.text()`.
- `pnpm parity:api` delta non-negative; `pnpm api:calls` and `pnpm api:extra`
  clean (the `new` call Rails makes stays credited).
