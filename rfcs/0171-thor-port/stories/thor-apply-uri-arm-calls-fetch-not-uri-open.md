---
title: "Port URI.open (open-uri) into ruby-compat and route Thor::Actions#apply's URI arm through it"
status: draft
updated: 2026-10-04
rfc: "0171-thor-port"
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

`Thor::Actions#apply` (`vendor/thor/v1.3.2/lib/thor/actions.rb:216-233`) fetches a URI template with
`require "open-uri"; URI.open(path, "Accept" => "application/x-thor-template", &:read)` (`:224-226`).

trails' port (`packages/trailties/src/thor/actions.ts`, `apply`, trails#8505) calls global `fetch`
directly, because ruby-compat has no `URI.open`: `packages/ruby-compat/src/uri.ts` exports the
parser classes only, and `HttpAdapter` (`packages/ruby-compat/src/http-adapter.ts`) has only
`createServer`, no client.

Two observable gaps follow:

- A non-2xx response is not raised. open-uri raises `OpenURI::HTTPError` ("404 Not Found"); the
  port imports the response body as the template module.
- The call is not `URI.open`, so the call gate cannot credit it.

## Acceptance criteria

- [ ] ruby-compat ports `URI.open` for `http(s)` (MRI `lib/open-uri.rb`, `OpenURI.open_uri` /
      `open_http`), async, over global `fetch`, with the header-hash argument and the block form,
      raising `OpenURI::HTTPError` with MRI's message on a non-2xx status. Receipted
      `@noRailsEquivalent PERMANENT` per ruby-compat's rule 2.
- [ ] `apply`'s URI arm in `packages/trailties/src/thor/actions.ts` is
      `await URI.open(path, { Accept: "application/x-thor-template" }, (io) => io.read())`, with no
      direct `fetch` call.
- [ ] A `.trails.test.ts` case covers the non-2xx raise through `apply`.
