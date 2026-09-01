---
title: "converge-actiondispatch-response-header-seat"
status: ready
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 58
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `retire-no-js-call-form-entries-and-fetch-receipts` (RFC 0129) after
review, and it is the reason one `@missingRailsCall key? — CONVERGEABLE` receipt
now sits on `ActionDispatch::Response#has_header?`
(`packages/actionpack/src/action-dispatch/http/response.ts`).

Rails' three header readers are one-liners over a seat that does the work
(`actionpack/lib/action_dispatch/http/response.rb:192-195`):

```ruby
def has_header?(key);   @headers.key? key;   end
def get_header(key);    @headers[key];       end
def set_header(key, v); @headers[key] = v;   end
def delete_header(key); @headers.delete key; end
```

`@headers` is a `Rack::Headers` (`vendor/rack/lib/rack/headers.rb`), which
downcases every key on write, so case-insensitivity is a property of the SEAT and
every reader is a plain delegation.

trails' `_headers` is a plain `Record<string, string>` that preserves the
caller's casing, so the fold moved to the READ site: `getHeader`
(`response.ts:175-183`) tries the exact key, then the downcased key, then scans
every stored key case-insensitively. `hasHeader` cannot then be Rails'
`@headers.key? key` — an exact-key `hasKey` answers `false` for a header stored
under a different casing, which `dispatch/response.test.ts`'s `has_header?` case
pins. Both shapes that keep the ported `key?` call were rejected in review, and
correctly: an inlined copy of the scan duplicates `getHeader`, and a
`hasKey(...) || this.getHeader(key) !== undefined` prefix is a dead branch,
because `getHeader`'s own first line already tries the exact key.

The fix is the seat, not the reader: give `_headers` Rack's write-side
normalization, and all four readers collapse to the Rails one-liners — including
`has_header?`, whose `key?` then becomes a real, non-redundant call and retires
the receipt.

`packages/rack/src/headers.ts` already exists as the `Rack::Headers` port and is
the natural seat. Note that response casing is observable in the emitted headers,
and `response.ts:38` carries a standing note about the file's lowercase
convention — so this is a behavioural change, which is why it is its own story
rather than a rename.

## Acceptance criteria

- `ActionDispatch::Response`'s header seat normalizes keys on write, the way
  `Rack::Headers` does, rather than folding case at each read.
- `hasHeader`, `getHeader`, `setHeader` and `deleteHeader` are the delegating
  one-liners of `response.rb:192-195`; the case-insensitive scan in `getHeader`
  is gone.
- The `@missingRailsCall key? — CONVERGEABLE converge-actiondispatch-response-header-seat`
  receipt on `hasHeader` is deleted, with the call actually made.
- `dispatch/response.test.ts`'s `has_header?` case and the actiondispatch http
  suite stay green; any emitted-header casing change is called out in the PR body.
- `pnpm parity:api:calls` shows no new rows.
