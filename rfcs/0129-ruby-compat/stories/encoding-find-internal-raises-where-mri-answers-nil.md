---
title: "Encoding.find(\"internal\") raises where MRI answers nil — no default_internal seat"
status: draft
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7488 grew `packages/ruby-compat/src/encoding.ts`'s `ROWS` to MRI's full
registry — the 103 canonical names `Encoding.list` reports plus the 72 aliases
in `Encoding.aliases`, read off the pinned ruby 3.3.11 ref. That closes 174 of
`Encoding.name_list`'s 175 names.

The one name left unanswered is `internal`. MRI resolves it through
`rb_default_internal_encoding` (`vendor/ruby/encoding.c`, `enc_find` ->
`str_to_encindex`), and returns **`nil`** rather than raising whenever
`Encoding.default_internal` is unset:

```console
$ ruby -e 'p Encoding.find("internal")'
nil
$ ruby -e 'p Encoding.name_list - (Encoding.list.map(&:name) + Encoding.aliases.keys)'
["internal"]
```

trails has no `default_internal` seat at all, so `Encoding.find("internal")`
raises `ArgumentError: unknown encoding name - internal` where Ruby answers
`nil`. #7488 enumerated this in the class JSDoc as the single exclusion, with
that reason, and `encoding.trails.test.ts` pins it: the MRI-name-list test
asserts `internal` is the ONLY unresolved name, so the gap cannot silently
widen.

Note this is not only a missing row — `find`'s return type is `Encoding`, never
`null`, so the seat and the signature move together. `locale`, `external` and
`filesystem` are already carried as plain aliases of the `UTF-8` row, which is
the right answer for them in trails but is a different mechanism from MRI's
(`rb_locale_encindex` / `rb_default_external_encoding`).

## Converged shape

Port the three default-encoding seats MRI's special aliases resolve through —
`Encoding.default_internal`, `Encoding.default_external`, and the locale /
filesystem encodings — and have `find` dispatch the four special names to them
instead of resolving `locale` / `external` / `filesystem` as static `UTF-8`
aliases.

`Encoding.find` then returns `Encoding | null`, matching `enc_find`, with
`internal` answering `null` while `default_internal` is unset. Every current
caller (`Rack::Multipart::Parser#find_encoding`,
`vendor/rack/lib/rack/multipart/parser.rb:489-493`) already has a
not-an-encoding arm, so widening the return type is where the work lands.

## Acceptance criteria

- [ ] `Encoding.find("internal")` returns `null` while `default_internal` is
      unset, rather than raising, matching MRI.
- [ ] `locale` / `external` / `filesystem` resolve through the default-encoding
      seats rather than as static aliases of the `UTF-8` row.
- [ ] `encoding.trails.test.ts`'s MRI-name-list test asserts NO unresolved
      names — the `["internal"]` expectation is deleted, not broadened.
- [ ] The class JSDoc's "one name with no row" paragraph is deleted with the
      exclusion it documents.
