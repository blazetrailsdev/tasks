---
title: "ActionDispatch::Request#content_length must answer an Integer, not undefined"
status: draft
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Request#content_length`
(`vendor/rails/actionpack/lib/action_dispatch/http/request.rb:292-295`) is

    def content_length
      return raw_post.bytesize if has_header?(TRANSFER_ENCODING)
      super.to_i
    end

`super` is `Rack::Request::Helpers#content_length`
(`vendor/rack/lib/rack/request.rb:199`), which answers the raw header string or
`nil` — and `nil.to_i` is `0`, so Rails' `content_length` is ALWAYS an Integer.

trails' port
(`packages/actionpack/src/action-dispatch/http/request.ts`, the
`get contentLength()` in the class body) returns `undefined` when the header is
absent or unparseable:

    get contentLength(): number | undefined {
      if (this.hasHeader(TRANSFER_ENCODING)) return new TextEncoder().encode(this.rawPost).length;
      const cl = this.getHeader("CONTENT_LENGTH") as string | undefined;
      if (!cl) return undefined;
      const n = parseInt(cl, 10);
      return isNaN(n) ? undefined : n;
    }

So every caller that Rails wrote against a guaranteed Integer — an arithmetic
comparison, a `> 0` guard — sees `undefined` in trails, and `undefined > 0` is
`false` where `0 > 0` is also false but `undefined + n` is `NaN`.

Surfaced while burning down the `Omit<RequestHelpers, ...>` list in #7380;
`contentLength` is one of the entries that legitimately STAYS omitted (Rails
really does override it), so the divergence is in the override's body, not in
the inheritance.

## Converged shape

`contentLength` returns `number`, never `undefined`:

- the `TRANSFER_ENCODING` arm already returns a number;
- the fall-through is `super.to_i` — the mixin's `string | null` run through
  Ruby `String#to_i` semantics, which yields `0` for `null`, `""` and a
  non-numeric prefix rather than `NaN`/`undefined`.

Check whether a `toI`-style helper already exists in `ruby-compat` before
hand-rolling the coercion. Then re-type the reader `number` and fix the call
sites the widened type surfaces.

## Acceptance criteria

- `contentLength` answers `0` — not `undefined` — for a request with no
  `CONTENT_LENGTH` header and for a non-numeric one.
- `pnpm typecheck` is clean with the reader typed `number`.
- `pnpm parity:api --package actiondispatch` does not regress on
  `http/request.rb`; `parity:api:calls` / `:args` gain no rows.
