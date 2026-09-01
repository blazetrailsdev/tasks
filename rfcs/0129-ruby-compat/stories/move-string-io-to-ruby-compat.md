---
title: "Ruby's stdlib StringIO moves to ruby-compat — Tempfile's shape, without Tempfile's adapter blocker"
status: claimed
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport"]
deps: []
deps-rfc: []
est-loc: 180
priority: 49
pr: null
claim: "2026-09-01T18:53:13Z"
assignee: "move-string-io-to-ruby-compat"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/string-io.ts` (**83 lines**, one exported class
`StringIO` at `:17` with `string`, `size`, `read`, `write`, `rewind`, `isEof`,
`close`, `closed`) is Ruby's **stdlib `StringIO`** — the in-memory IO that
`XmlMini._parse_file` (`vendor/rails/activesupport/lib/active_support/
xml_mini.rb:180-186`) and `Rack::MockRequest` hand their callers. It is the
same shape as `Tempfile` (`move-tempfile-to-ruby-compat`) — Ruby stdlib that
Rails _uses_ and never declares — and unlike `Tempfile` it is **not** blocked
by the platform-adapter question.

Its receipt already states the verdict, and the RFC's own precedent
(`@blazetrails/date` standing in for the `date` gem) is the model:

```text
@noRailsEquivalent PERMANENT — Ruby stdlib, not Rails: `StringIO` ships with
the interpreter, so no Rails file defines it and no port can remove the need
for it while `_parse_file` and `Rack::MockRequest` hand callers an IO.
```

Four-part test (README §1, §2, §4), item by item:

1. **No `vendor/rails/` counterpart.** Confirmed:
   `parity:api:extra --package activesupport` scores `string-io.ts` as
   `0 novel, 9 moved [no Rails counterpart]` — no Rails file maps onto it. The
   9 "moved" are names Rails _sends_ (`read`, `write`, `rewind`, `size`…),
   which is exactly what a stdlib stand-in should look like.
2. **MRI counterpart.** `vendor/ruby/ext/stringio/stringio.c` — e.g.
   `strio_write` at `:1432`. `stringio` is an ext bundled inside `ruby/ruby`
   itself, so the citation resolves at the pinned `v3_3_11` with no extra
   vendoring. (This is the discriminator against `rexml/document.ts`, which is
   a bundled _gem_ and is NOT in the vendored MRI tree.)
3. **trails actually calls it.** **39 call sites across 4 packages** outside
   the defining file, excluding tests: `activesupport` 31 (`xml-mini.ts` 7,
   `xml-mini/nokogiri.ts` 7, `xml-mini/nokogirisax.ts` 7,
   `core-ext/hash/conversions.ts` 4, `hash-utils.ts` 3, plus
   `xml-mini/rexml.ts`, `index.ts`, `cache/behaviors/cache-store-behavior.ts`),
   `rack` 7 (`handler/node.ts` 4, `mock-request.ts` 3), `activerecord` 1
   (`testing/sql-capture.ts`), and `website` 4 (`lib/frontiers/rack-bridge.ts`).
4. **No workspace dependency dragged.** `string-io.ts` has **zero `import`
   statements**. It is already a leaf; no `getFs`/`getPath`/`getCrypto` in
   sight, which is what separates it from `Tempfile`.

Only the members Ruby code in this repo sends are ported already, so there is
little or nothing to trim — but check each of the nine against a live call site
before keeping it (README §1).

## Acceptance criteria

- `StringIO` lives at `packages/ruby-compat/src/string-io.ts`, exported from the
  package index, with a resolving `vendor/ruby/ext/stringio/stringio.c:LINE`
  citation and a `@noRailsEquivalent PERMANENT` receipt.
- `activesupport/src/string-io.ts` becomes a bare re-export shim; the
  `@blazetrails/activesupport` public surface is unchanged and all 39 call
  sites — including `rack`'s and `website`'s — keep working untouched. The shim
  is deleted by `delete-ruby-compat-reexport-shims`.
- Any member with no call site in this repo is deleted rather than moved.
- `packages/ruby-compat` still has no `dependencies` block; `rack` and
  `activerecord` are unaffected because they keep importing through the shim.
- `parity:api:extra:gate`'s ruby-compat mark is raised by a reviewed line of
  this diff, sized to the exports actually added — never a reseed.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params` show no new rows; `parity:test` delta non-negative.
- Tests move with the code and keep their names; a Rails-anchored test file
  (matched by `parity:test`) STAYS in its current package.
- `no-freeform-comments` is `error` on `packages/ruby-compat/**`: the relocated
  header prose survives only as one block comment carrying the citation.
