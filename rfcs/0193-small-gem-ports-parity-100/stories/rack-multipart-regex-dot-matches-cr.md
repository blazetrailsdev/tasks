---
title: "rack multipart regexes spell Ruby's . as [^\\n] (MULTIPART_CONTENT_TYPE)"
status: done
updated: 2026-10-22
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9230
claim: "2026-10-22T16:53:09Z"
assignee: "globalid-locate-many-index-by-converges"
blocked-by: null
closed-reason: null
---

## Context

Ruby's `.` matches `\r` (it excludes only `\n`); JS's `.` excludes `\r` too. trails#9154 converged `MULTIPART_CONTENT_DISPOSITION` (`vendor/rack/v3.1.14/lib/rack/multipart/parser.rb:36`) to `([^\n]*)`. `MULTIPART_CONTENT_TYPE` (`parser.rb:35`, `/Content-Type: (.*)#{EOL}/ni`) is still `(.*)` in `packages/rack/src/multipart/parser.ts`, so a content-type header value containing a bare `\r` before the CRLF fails to match where Rack matches it. Other ported rack regexes using `.` likely carry the same gap.

## Acceptance criteria

- [ ] `MULTIPART_CONTENT_TYPE` is spelled `Content-Type: ([^\n]*)\r\n` (case-insensitive), the JS form of Ruby's `.`.
- [ ] Every `.` in a regex ported from `vendor/rack/v3.1.14/lib/rack/**` gets the same audit, and each one Ruby lets match `\r` is converged.
- [ ] A test proves a part whose content-type value contains `\r` parses as in Rack.
