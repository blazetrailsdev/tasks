---
title: "Seat Multipart::EmptyContentError under EOFError and raise EOFError from BoundedIO#read"
status: ready
updated: 2026-09-06
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 33
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rack seats `EmptyContentError` under Ruby's `EOFError`, and `BoundedIO#read`
raises the plain `EOFError`:

```ruby
class EmptyContentError < ::EOFError      # multipart/parser.rb:20-22
  include BadRequest
end

def read(size, outbuf = nil)              # multipart/parser.rb:59-73
  ...
  if str
    @cursor += str.bytesize
  else
    raise EOFError, "bad content body"    # :70
  end
  str
end
```

trails diverges on both halves
(`packages/rack/src/multipart/parser.ts:17-22,57-65`):

- `EmptyContentError extends Error`, not `EOFError`, so nothing in the tree
  can `rescue EOFError` the way Rack's callers can.
- `BoundedIO.read` throws `new EmptyContentError("bad content body")` where
  Rack raises `EOFError` — the subclass, not the class Rack names at that
  raise site.

`@blazetrails/ruby-compat` already exports `EOFError`
(`packages/ruby-compat/src/eof-error.ts`; `string-io.ts` imports it), so
neither half is blocked.

Surfaced in #7572 by `spec_multipart.rb:340-345`, which asserts
`EOFError` for a CONTENT_LENGTH mismatch where the trails test asserts
`EmptyContentError`. The trails test passes today only because the
subclass happens to be what is thrown.

## Converged shape

`class EmptyContentError extends EOFError` (`parser.rb:20`), and
`BoundedIO.read`'s failure arm throws `new EOFError("bad content body")`
(`parser.rb:70`). The trails test at `multipart.test.ts`'s "raises an EOF
error on content-length mismatch" then asserts `EOFError`, as
`spec_multipart.rb:340-345` does.

Note `EmptyContentError` also `include BadRequest` (`parser.rb:21`); that
half belongs to [[port-rack-bad-request-marker-module]], not here.

## Acceptance criteria

- [ ] `EmptyContentError` extends ruby-compat's `EOFError`.
- [ ] `BoundedIO.read` raises `EOFError`, not `EmptyContentError`.
- [ ] "raises an EOF error on content-length mismatch" asserts `EOFError`,
      matching `spec_multipart.rb:340-345`.
- [ ] `pnpm parity:api:calls` / `:calls:args` / `parity:test:assertions`
      non-negative.
