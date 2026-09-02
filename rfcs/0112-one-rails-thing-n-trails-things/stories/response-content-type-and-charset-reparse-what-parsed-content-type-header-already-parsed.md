---
title: "Response#content_type and #charset re-parse the header Rails reads through parsed_content_type_header"
status: draft
updated: 2026-09-02
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #7366 (`converge-actiondispatch-response-header-seat`),
which converged `ActionDispatch::Response`'s header SEAT onto the ported
`Rack::Headers` and routed every header access through
`getHeader`/`setHeader`/`deleteHeader`. The readers ON TOP of those accessors
are a separate deviation, left alone there as out of scope.

Rails does not parse the Content-Type header in either `content_type` or
`charset`. Both are one-liners over collaborators:

```ruby
def content_type
  super.presence
end
```

(`actionpack/lib/action_dispatch/http/response.rb:269-271` — `super` is
`Rack::Response::Helpers#content_type`, itself `get_header CONTENT_TYPE`,
`vendor/rack/lib/rack/response.rb:240-242`), and

```ruby
def charset
  header_info = parsed_content_type_header
  header_info.charset || self.class.default_charset
end
```

(`response.rb:300-303`). `media_type` is `parsed_content_type_header.mime_type`
(`response.rb:274-276`).

trails reimplements the parse inline in both readers, in
`packages/actionpack/src/action-dispatch/http/response.ts`:

- `get contentType()` splits the raw header on `";"` and trims the first field
  rather than answering `super.presence` — so it also answers a MEDIA TYPE where
  Rails' `content_type` answers the whole header value, which is what
  `media_type` (`:274-276`) is for.
- `get charset()` runs a `/charset=([^\s;]+)/i` regex over the raw header,
  where Rails reads `parsed_content_type_header.charset`.

Both duplicate `parsedContentTypeHeader()` / `parseContentType()`, which already
exist in the same file and already implement `CONTENT_TYPE_PARSER` — so this is
one Rails thing spelled three times in one trails file. Note the `contentType`
change is behaviour-carrying (the full header value, not just the mime type),
which is why it is filed rather than folded into #7366.

## Acceptance criteria

- [ ] `get contentType()` is `super.presence` over `getHeader(CONTENT_TYPE)`
      (`response.rb:269-271`, `rack/response.rb:240-242`) — the whole header
      value, `presence`-folded, with no inline split.
- [ ] `get charset()` reads `parsedContentTypeHeader()` and falls back to
      `defaultCharset` (`response.rb:300-303`); the inline regex is deleted.
- [ ] `get mediaType()` stays `parsedContentTypeHeader().mimeType`
      (`response.rb:274-276`) — it already does, and it is where callers wanting
      the old `contentType` behaviour go.
- [ ] Call sites of `contentType` that wanted the mime type alone move to
      `mediaType`; the actionpack and actionview suites stay green.
- [ ] `pnpm parity:api:calls` / `parity:api:calls:args` show no new rows.
