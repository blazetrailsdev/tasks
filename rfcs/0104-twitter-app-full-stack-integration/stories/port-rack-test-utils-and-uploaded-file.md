---
title: "port-rack-test-utils-and-uploaded-file"
status: draft
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
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

PR for `converge-integration-session-to-rack-test-session` ported the slice of
`Rack::Test::Session` and `Rack::Test::CookieJar` that
`ActionDispatch::Integration::Session#process` actually drives
(`vendor/rack-test/lib/rack/test.rb:143-382`,
`vendor/rack-test/lib/rack/test/cookie_jar.rb`), and stopped there to stay
inside the PR LOC ceiling. `pnpm parity:api` reports rack-test at 31/101
methods, files 2/5.

Not yet ported:

- `lib/rack/test/utils.rb` (156 lines) — `build_multipart`,
  `build_nested_query`, `parse_nested_query`. `Session#env_for`
  (`test.rb:307-331`) therefore takes only the `build_nested_query` arm; the
  multipart arm is missing.
- `lib/rack/test/uploaded_file.rb` (99 lines).
- `lib/rack/test/methods.rb` (94 lines).
- `Session` members left out of the first slice: the generated verb methods
  (`test.rb:105-111`), `custom_request`, `header`, `env`, `basic_authorize`,
  `follow_redirect!`, `restore_state`, `after_request`, `:query_params`
  handling, and `MULTIPART_BOUNDARY` / `START_BOUNDARY` / `END_BOUNDARY`.
- `CookieJar` / `Cookie` members left out: `Cookie#empty?`, `#http_only?`,
  `#to_h`/`#to_hash`, `CookieJar#initialize_copy`, `#get_cookie`, `#delete`.

## Acceptance criteria

- [ ] `packages/rack-test/src/utils.ts`, `uploaded-file.ts` and `methods.ts`
      exist and mirror their `.rb` counterparts.
- [ ] `Session#envFor` takes the multipart arm through `buildMultipart`.
- [ ] The `Session` and `CookieJar` members listed above are ported.
- [ ] `pnpm parity:api` rack-test files reach 5/5.
