---
title: "The no-attributes scaffold's params.fetch arm still casts to Record<string, unknown>"
status: draft
updated: 2026-10-01
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack", "trailties"]
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A scaffold generated with no attributes emits
`return this.params.fetch("post", {}) as Record<string, unknown>;` with an explicit
`Record<string, unknown>` return type (`paramsMethod`,
`packages/trailties/src/generators/rails/scaffold-controller/scaffold-controller-generator.ts`).
trails#8308 removed the cast from the `params.expect` arm but kept it here, because
`Parameters#fetch` is typed `fetch(key: string, ...args: unknown[]): unknown`
(`packages/actionpack/src/action-controller/metal/strong-parameters.ts`).

Rails' template is `params.fetch(:post, {})`, and `fetch`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb`, `def fetch`)
returns `convert_value_to_parameters` of the stored value or of the default, so a hash default
yields a `Parameters` when the key is absent. The returned `Parameters` is not permitted, so
`Post.new(params.fetch(:post, {}))` raises `ForbiddenAttributesError` for a non-empty hash, in
Rails as in trails; the cast hides that from the type checker by presenting it as a plain hash.

## Acceptance criteria

- [ ] `fetch` gets overloads: a hash default returns `unknown` narrowed no further than Rails
      allows (the stored value may be any type), and the generator emits no cast and no
      `Record<string, unknown>` return type for the no-attributes scaffold.
- [ ] `Post.new(this.postParams())` in that scaffold type-checks through `PermittedAttributes`
      or a narrowing the generator emits, not a cast.
- [ ] The scaffold snapshot and generator tests are updated.
