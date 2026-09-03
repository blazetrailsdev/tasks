---
title: "converge TestSession#id_was and #load! onto a direct @id read"
status: done
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 7414
claim: "2026-09-02T23:13:25Z"
assignee: "converge-find-session-first-param-spelling"
blocked-by: null
closed-reason: null
---

## Context

`SessionHash`'s `@id` is TS-`private` (`packages/rack-session/src/abstract/id.ts:93`,
`private _id: unknown;`), so a subclass cannot read the ivar Ruby reads directly.
`ActionController::TestSession` needs it twice:

```ruby
def id_was
  @id
end

private
  def load!
    @id
  end
```

(`vendor/rails/actionpack/lib/action_controller/test_case.rb:237-244`.)

`converge-test-session-superclass` (#7408) shipped both as
`return this.id()` — the inherited reader
(`abstract/id.ts`, Ruby `abstract/id.rb:74-78`) — with a JSDoc note at each
call site. That is behaviourally equivalent only because `TestSession#initialize`
sets `@loaded = true`, so `id()`'s `return @id if @loaded or defined?(@id)` arm
always wins; it is still a call Rails' body does not make.

## Converged shape

Make `SessionHash`'s `_id` (and the `idDefined` flag that carries
`instance_variable_defined?(:@id)`) `protected` — the same edge already taken for
`data` / `loaded` in `converge-null-session-hash-superclass` — and write both
TestSession bodies as the plain ivar read Rails has:

```ts
idWas(): unknown {
  return this._id;
}

override loadBang(): unknown {
  return this._id;
}
```

Drop the two JSDoc deviation notes with them.

## Acceptance criteria

- `SessionHash#_id` / `idDefined` are `protected`, not `private`.
- `TestSession#idWas` and `#loadBang` read `this._id` directly, matching
  `test_case.rb:237-244`; neither JSDoc carries a deviation note any more.
- `pnpm parity:api` rack-session and actioncontroller figures non-negative;
  `pnpm parity:api:calls` green (the reads are ivar reads, not calls).
