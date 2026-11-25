---
title: "URI#to_s drops an empty userinfo, as Ruby's does"
status: draft
updated: 2026-11-25
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

`URI.parse("https://@a.com").toString()` returns `https://@a.com` in
`@blazetrails/ruby-compat`. Ruby 3.3 / uri 1.1.2 returns `https://a.com`: the
empty userinfo is dropped (`vendor/ruby/v3.3.11/lib/uri/generic.rb` `to_s`
writes userinfo only when `self.userinfo` is truthy, and `set_userinfo` /
`split_userinfo` leave no user for an empty string).

Surfaced by trailmap#199's review, where trailmap's `deployPreviewUrl` now
mirrors Rails' `URI.parse(url).to_s`. It is not reachable from realistic
preview URLs, so trailmap carries no workaround.

## Acceptance criteria

- `URI.parse("https://@a.com").toString()` is `"https://a.com"`, and `userinfo`
  / `user` read what Ruby's do for that input.
- A ruby-compat test pins it, citing the uri generic.rb lines.
