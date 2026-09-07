---
title: "Port AbstractCookieJar; the three chained jars each hand-roll its []="
status: draft
updated: 2026-09-07
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails factors the three chained cookie jars onto one `AbstractCookieJar`
(`vendor/rails/actionpack/lib/action_dispatch/middleware/cookies.rb:505-535`)
that owns the single `[]=` body:

```ruby
class AbstractCookieJar # :nodoc:
  include ChainedCookieJars

  def initialize(parent_jar)
    @parent_jar = parent_jar
  end

  def [](name) ... end

  def []=(name, options)          # :525-533
    if options.is_a?(Hash)
      options.symbolize_keys!
    else
      options = { value: options }
    end

    commit(name, options)
    @parent_jar[name] = options
  end
```

Each concrete jar then supplies only a private `commit` hook — that is the
whole of `PermanentCookieJar` (`:558-563`):

```ruby
class PermanentCookieJar < AbstractCookieJar # :nodoc:
  private
    def commit(name, options)
      options[:expires] = 20.years.from_now
    end
end
```

trails has no `AbstractCookieJar` at all. `PermanentCookieJar`,
`SignedCookieJar` and `EncryptedCookieJar`
(`packages/actionpack/src/action-dispatch/middleware/cookies.ts`, the `set`
methods at roughly `:311`, `:368`, `:423`) each hand-roll a full `set` body
that re-does the Hash-vs-value normalization Rails does once, then calls
`this.jar.set(...)` directly. Three copies of one Rails method, with the
`commit` hook inlined into each — the opposite of Rails' decomposition,
which CLAUDE.md's "Decomposition" rule names directly ("If Rails extracts a
private helper, extract it, with the Rails name. One Rails method is one TS
method").

None of the three returns a value either, where Ruby's `[]=` returns the
assigned options.

Surfaced in #7581, which converged `CookieJar#[]=` (`cookies.rb:371-390`) —
the _parent_ jar's index-assign — onto its Ruby body and made it return the
assigned value. That left the three child jars visibly out of step with the
method they delegate to, but converging them is a separate, larger change
with its own test surface.

## Converged shape

Introduce `AbstractCookieJar` with the `initialize`, `[]` and `[]=` bodies
from `cookies.rb:505-535`, and reduce `PermanentCookieJar`,
`SignedCookieJar` and `EncryptedCookieJar` to their `commit` (and
`parse`/`serialize`) hooks, as `cookies.rb:558-563` and the
`SerializedCookieJars` module do. Note trails already has a `commit`
imported into the serialized jars (`commit.call(this.host, key, options)`),
so the hook exists — it is the shared `[]=` that does not.

Check `ChainedCookieJars` (`cookies.rb:506`) before starting: the
`permanent` / `signed` / `encrypted` / `signed_or_encrypted` readers trails
puts on `CookieJar` are that module's, and where they should live is part of
this shape.

## Acceptance criteria

- [ ] `AbstractCookieJar` exists with `[]=` mirroring `cookies.rb:525-533`,
      returning the assigned value.
- [ ] `PermanentCookieJar`, `SignedCookieJar` and `EncryptedCookieJar` carry
      only the hooks Rails gives them; no duplicated normalization body
      survives.
- [ ] Rails' chained-jar tests in `dispatch/cookies.test.ts` still pass, with
      no test renamed or reworded.
- [ ] `pnpm parity:api --package actionpack` deltas non-negative;
      `parity:api:extra --package actionpack` does not grow; both call gates
      green with no new baseline rows.
