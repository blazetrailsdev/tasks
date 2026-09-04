---
title: "parse_formatted_parameters adds a rawPost guard and a media-type key fallback Rails has neither of"
status: draft
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::Http::Parameters#parse_formatted_parameters`
(`vendor/rails/actionpack/lib/action_dispatch/http/parameters.rb:89-100`):

```ruby
def parse_formatted_parameters(parsers)
  return yield if content_length.zero? || content_mime_type.nil?

  strategy = parsers.fetch(content_mime_type.symbol) { return yield }

  begin
    strategy.call(raw_post)
  rescue # JSON or Ruby code block errors.
    log_parse_error_once
    raise ParseError, "Error occurred while parsing request parameters"
  end
end
```

`packages/actionpack/src/action-dispatch/http/parameters.ts:105-120` diverges in
three places:

- **The guard gains a third clause.** Rails returns the block only for
  `content_length.zero? || content_mime_type.nil?`; trails adds `|| !this.rawPost`,
  so an empty-string body with a real content type takes the fallback where Rails
  calls the strategy with `""` and lets it raise.
- **The registry key falls back to the media type.** Rails looks up
  `content_mime_type.symbol` — `nil` for an unregistered type, which simply
  misses. trails uses `this.contentMimeType.symbol ?? this.contentMimeType.toString()`,
  so a parser registered under a media-type STRING is reachable where Rails
  reaches none. Since PR #7487 the registry keys are colon-spelled Symbols
  (`":json"`), which makes the string arm reachable only by a key Rails' hash
  could never hold.
- **`fetch` with a block is spelled as a miss test.** `parsers.fetch(key) { return yield }`
  returns the STORED value whenever the key exists, including a stored `nil`;
  trails' `const strategy = parsers[symbol]; if (!strategy) return fallback();`
  also takes the fallback for a stored falsy parser. ruby-compat's `fetch` with a
  `block()` is the settled spelling (CLAUDE.md, "`fetch` vs `??`").

Surfaced while converging `MimeType#symbol` onto the colon convention in
PR #7487, which touched the registry this method reads but left the method body
alone.

## Converged shape

```ts
if (this.contentLength === 0 || this.contentMimeType === null) return fallback();
const strategy = fetch(parsers, this.contentMimeType.symbol, block(() => fallback()));
```

with the `rawPost` clause dropped and the `?? toString()` fallback dropped, so
the key is `content_mime_type.symbol` and nothing else.

## Acceptance criteria

- [ ] The guard is exactly `contentLength === 0 || contentMimeType === null`,
      mirroring `parameters.rb:90`.
- [ ] The parser is looked up by `contentMimeType.symbol` alone, through
      ruby-compat's block-taking `fetch`, mirroring `parameters.rb:92`.
- [ ] A parser stored under a media-type string is no longer reachable; a
      request whose mime type is unregistered takes the fallback.
- [ ] actionpack suite green; `pnpm parity:api:calls` non-negative.
