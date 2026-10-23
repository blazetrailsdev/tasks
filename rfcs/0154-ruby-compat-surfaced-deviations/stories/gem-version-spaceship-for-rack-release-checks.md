---
title: "ActionDispatch::Constants ports its Rack 2 arm through Gem::Version#<=>"
status: ready
updated: 2026-10-23
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Gem::Version#<=>` is ported (`packages/ruby-compat/src/gem/version.ts:47`,
spelled `compare`, `vendor/ruby/v3.3.11/lib/rubygems/version.rb:361-389`), and
trails#9053 converged `ActionDispatch::SSL#flag_cookies_as_secure!`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/ssl.rb:129-150`)
onto it: `packages/actionpack/src/action-dispatch/middleware/ssl.ts:124` is
`if (new Gem.Version(RELEASE).compare(new Gem.Version("3"))! < 0)`.

One Rails body still keeps only the Rack 3 arm. `ActionDispatch::Constants`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/constants.rb:10-32`) is

```ruby
if Gem::Version.new(Rack::RELEASE) < Gem::Version.new("3")
  VARY = "Vary"
  ...
else
  VARY = "vary"
  ...
end
```

and `packages/actionpack/src/action-dispatch/constants.ts` exports the ten
lower-case values unconditionally.

## Acceptance criteria

- [ ] `constants.ts` computes the ten constants under the same
      `Gem::Version.new(Rack::RELEASE) < Gem::Version.new("3")` test
      `constants.rb:10` makes, through `Gem.Version#compare` and `RELEASE` from
      `@blazetrails/rack`, with both arms' values as Rails spells them.
- [ ] The constants stay plain `export const` bindings readable by importers
      (a `let` assigned in an `if` / ternary per constant, not a function).
- [ ] `pnpm parity:api:calls` stays green; actionpack tests that read the
      constants pass.
