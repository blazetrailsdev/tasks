---
title: "strong-parameters-expect-returns-unknown"
status: ready
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Parameters#expect` (`packages/actionpack/src/action-controller/metal/strong-parameters.ts:169`)
is typed `expect(...filters: (string | Record<string, unknown>)[]): unknown`.
Rails' body (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:772-777`):

```ruby
def expect(*filters)
  params = permit_filters(filters)
  keys = filters.flatten.flat_map { |f| f.is_a?(Hash) ? f.keys : f }
  values = params.require(keys)
  values.size == 1 ? values.first : values
end
```

`expect(post: [...])` returns the permitted `Parameters` for `post`, and `expect(:id)` returns the scalar.
Because both are `unknown` in trails, the scaffold controller emits
`private postParams(): Record<string, unknown> { return this.params.expect({ post: ["title", "body"] }) as Record<string, unknown>; }`,
with a cast, and `Post.find(this.params.expect("id"))` is `find(unknown)`.

Found auditing the types of a freshly scaffolded app (`trails new blog` + `generate scaffold Post title:string body:text`) on `main` `53a6249ae6`, while writing the README for PR #8195.

## Converged shape

`expect` / `expect!` (`:786-790`) get overloads that follow the argument shape.
A single hash filter returns `Parameters`, a single scalar key returns the scalar
(`string`, or the `Parameters` value type), and several keys return a tuple.
`Post.new` / `update` accept `Parameters`, as Rails' `sanitize_for_mass_assignment` does.

## Acceptance criteria

- [ ] The scaffold controller's `postParams()` needs no `as` cast. The generator template drops it.
- [ ] Type tests cover both `expect` forms.
