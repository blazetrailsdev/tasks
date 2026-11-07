---
title: "rack-3-2-port-remaining-multipart-specs"
status: draft
updated: 2026-11-07
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9831 bumped rack to v3.2.8. Several of its new tests are not ported yet.

In `vendor/rack/v3.2.8/test/spec_multipart.rb`, the `with_multipart_limit` tests reassign `Parser::PARSER_BYTESIZE_LIMIT` (:32-42): "raises an exception if Content-Length exceeds total bytesize limit", "allows requests within the total bytesize limit", "skips total bytesize check when there is no limit", and "enforces total bytesize limit during streaming when Content-Length is absent".

Also in `spec_multipart.rb`, the pipe/thread tests: "rejects excessive data before boundary", "rejects excessive mime header size", the two "rejects excessive buffered mime data size" tests, "allows large nonbuffered mime parameters", "parses when the MIME head terminator straddles the BUFSIZE boundary", and "does not retain parsed parts when reads end …". The UploadedFile test "delegates keyword arguments to the tempfile" is missing too.

In `spec_request.rb`, the deprecated "parses multipart content when called using Rack::Request#parse_multipart" is not ported.

TS: `packages/rack/src/multipart.test.ts`; the `Parser` statics in `packages/rack/src/multipart/parser.ts`.

## Acceptance criteria

- Each test is ported with its Rails name, using a generator-backed reader as in the existing "rejects insanely long boundaries" port, or is parked under `PERMANENT-SKIP:` with a cited reason.
