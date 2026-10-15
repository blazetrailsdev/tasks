---
title: "gem-version-spaceship-for-rack-release-checks"
status: draft
updated: 2026-10-15
rfc: "0154-ruby-compat-surfaced-deviations"
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

`Gem::Version` in ruby-compat (`packages/ruby-compat/src/gem/version.ts`) has no
`<=>` (rubygems `lib/rubygems/version.rb` `Version#<=>`, plus `Comparable`), so
no port can spell `Gem::Version.new(Rack::RELEASE) < Gem::Version.new("3")`.

Two Rails bodies branch on it and the ports keep only the Rack 3 arm:

- `ActionDispatch::SSL#flag_cookies_as_secure!`
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/ssl.rb:129-150`)
  — `packages/actionpack/src/action-dispatch/middleware/ssl.ts`
  `flagCookiesAsSecureBang`; the call gate keeps the row
  `actiondispatch middleware/ssl.ts flag_cookies_as_secure! new` in
  `scripts/api-compare/call-mismatches-exclude/actiondispatch/middleware/ssl.json`.
- `ActionDispatch::Constants`
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/constants.rb:10`) —
  `packages/actionpack/src/action-dispatch/constants.ts`.

## Acceptance criteria

- `Gem::Version#<=>` is ported in ruby-compat with its MRI/rubygems citation,
  and `Comparable`'s `<` reaches it.
- `SSL#flag_cookies_as_secure!` ports both arms with the version check, and the
  `ssl.json` `new` row is deleted by hand (marks tightened, no reseed).
