---
title: "Converge env_for's Symbol option keys onto the colon spelling and delete SYMBOL_OPTS (mock_request.rb:154-156)"
status: done
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: 22
pr: 7401
claim: "2026-09-02T18:45:08Z"
assignee: "converge-env-for-symbol-opts-onto-colon-spelling"
blocked-by: null
closed-reason: null
---

## Context

`Rack::MockRequest.env_for` ends with

```ruby
opts.each { |field, value|
  env[field] = value if String === field
}
```

(`vendor/rack/lib/rack/mock_request.rb:154-156`) — the copy that lets a caller
push arbitrary CGI variables straight into the env, and that skips the option
keys Rack passes as Symbols (`:method`, `:params`, `:script_name`,
`:http_version`, `:fatal`, `:input`, `:lint`).

trails cannot make that test, because every `env_for` caller in the repo passes
a plain JS object whose Symbol keys and String keys are both strings. The port
therefore inverts the guard into a hard-coded exclusion list, `SYMBOL_OPTS` in
`packages/rack/src/mock-request.ts`, tagged `@noRailsEquivalent PERMANENT`.

Two costs: a caller can no longer set a CGI variable literally named `input` or
`method`, and the list must be hand-maintained against Rack's option set — a new
Rack option silently lands in the env.

CLAUDE.md already ratifies the shape that fixes this: "A Ruby Symbol is a JS
string, never a JS `Symbol`... Where a method's control flow turns on
`Symbol === x`, keep the Symbol's leading colon in the string: `":short"`, and
`.slice(1)` for its name." So the converged form spells the option keys
`":method"`, `":params"`, `":script_name"`, `":http_version"`, `":fatal"`,
`":input"`, `":lint"`, and the trailing loop becomes the literal
`if (!field.startsWith(":"))` test, with `SYMBOL_OPTS` deleted.

The cost is that every `env_for`/`MockRequest#get`/`#post`/... call site in
`rack`, `rack-session` and `actionpack` moves to the colon spelling, which is
what makes this its own story rather than a drive-by. Surfaced in PR #7363.

## Acceptance criteria

- `env_for`'s option keys carry the leading colon, and the trailing copy loop
  tests the colon rather than consulting an exclusion set.
- `SYMBOL_OPTS` and its `@noRailsEquivalent PERMANENT` receipt are deleted.
- Every call site in `rack`, `rack-session` and `actionpack` is updated; a CGI
  variable literally named `input` or `method` reaches the env unmolested, with
  a test covering it.
