---
title: "Headers#env_name invents four arms where Rails has one HTTP_HEADER regex guard"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 31
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Headers#env_name` (`vendor/rails/actionpack/lib/action_dispatch/http/headers.rb:120-128`)
is four lines:

```ruby
def env_name(key)
  key = key.to_s
  if HTTP_HEADER.match?(key)
    key = key.upcase
    key.tr!("-", "_")
    key.prepend("HTTP_") unless CGI_VARIABLES.include?(key)
  end
  key
end
```

`HTTP_HEADER` is `/\A[A-Za-z0-9-]+\z/` (`headers.rb:50`), so a key containing a
`.` or a `_` falls through untouched — that single regex is the whole guard.

`packages/actionpack/src/action-dispatch/http/headers.ts#envName` invents four
arms instead: an explicit `str.includes(".")` early return, a
`CGI_VARIABLES.has(str) || str.startsWith("HTTP_")` early return, and two more
`CGI_VARIABLES` / `HTTP_` checks after upcasing. It reaches the same answer for
the cases the tests cover, but it is not the Rails body, and its `_`-bearing
keys take the upcase path Rails' regex excludes.

PR #7302 rewrote every other member of this class onto the request; `envName`
was left as-is because the parameter-name story did not reach it.

The same file also spells `[]` / `[]=` / `key?` / `merge!` as `get` / `set` /
`has` + `isKey` / `mergeBang` + `mergeInPlace` — pairs of TS names where Rails
has one method — which is a separate naming question worth deciding at the same
time.

## Acceptance criteria

- `envName` is the four-line Rails body behind the `HTTP_HEADER` regex, with no
  extra early returns.
- The duplicated `key?`/`merge!` spellings are resolved to one name each, per
  `docs/ruby-ts-conventions.md`, or the duplication is a `pnpm tasks block`
  naming the shortcoming.
- No test renamed; `pnpm parity:api:extra --package actiondispatch` does not
  grow.
