---
title: "GzipStream#each duck-types on read/forEach where Rack branches on ::File and requires each"
status: done
updated: 2026-09-06
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 7570
claim: "2026-09-06T12:38:20Z"
assignee: "json-serialization-tests-stand-ins-are-person-not-contact"
blocked-by: null
closed-reason: null
---

## Context

`Rack::Deflater::GzipStream#each` branches on the body's CLASS
(`vendor/rack/lib/rack/deflater.rb:101`):

```ruby
if @body.is_a? ::File # XXX: Should probably be ::IO
  while part = @body.read(BUFFER_LENGTH)
```

`packages/rack/src/deflater.ts`'s `each` instead duck-types on the METHOD:

```ts
if (typeof this.body.read === "function") {
```

Any body answering `read` — not just a `File` — takes the buffered branch, so a
Rack body that happens to expose `read` alongside `each` is read the wrong way
round. The `else` arm has a second duck-type, `this.body.each ?? this.body.forEach`;
Rack bodies answer `each`, and `forEach` is a trails-only affordance with no
Rack counterpart.

Surfaced while porting `Deflater#call` in #7532, which did not touch
`GzipStream#each`.

## Converged shape

Branch on the trails analogue of `::File` rather than on `read`'s presence —
`ruby-compat`'s `File` is the counterpart constant — and drop the `forEach`
fallback so the `else` arm calls `each`, as Rack requires of a body.

## Acceptance criteria

- [ ] The buffered branch is taken only for a `File`, not for any object
      answering `read`.
- [ ] The streaming branch calls `each`; the `forEach` fallback is gone (or
      carries a `@noRailsEquivalent` receipt if a trails caller genuinely
      depends on it — check `packages/rack/src` first).
- [ ] `deflater.test.ts` and `deflater.trails.test.ts` stay green.
