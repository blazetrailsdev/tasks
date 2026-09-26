---
title: "assign_parameters' GET branch compares requestMethod instead of calling get?, and tests query_string truthiness instead of blank?"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
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

## Context

`ActionController::TestRequest#assign_parameters`
(`vendor/rails/actionpack/lib/action_controller/test_case.rb:105-108`) branches
on Rack's request predicate and on `blank?`:

```ruby
if get?
  if query_string.blank?
    self.query_string = non_path_parameters.to_query
  end
```

`get?` is `Rack::Request::Helpers#get?` (`vendor/rack/.../lib/rack/request.rb:223`,
`request_method == GET`). trails'
`packages/actionpack/src/action-controller/test-case.ts` `assignParameters`
spells the branch `if (this.requestMethod === "GET")` and
`if (!this.getHeader("QUERY_STRING"))`. That leaves the `get?` call omitted,
baselined in
`scripts/api-compare/call-mismatches-exclude/actioncontroller/test-case.json`
(`rubyName: assign_parameters`, `call: get?`). The truthiness test also
diverges from `blank?`: a whitespace-only `QUERY_STRING` is blank in Ruby but
truthy in JS. trails already has the predicate: `isGet()` in
`packages/rack/src/request.ts:177`.

## Converged shape

```ts
if (this.isGet()) {
  if (isBlank(this.queryString)) {
    this.queryString = toQuery(nonPathParameters);
```

Use the ActiveSupport `blank?` analogue. Keep whatever `to_query` spelling
the other call sites already use; `buildNestedQuery` stands in for it today.

## Acceptance criteria

- `assignParameters` calls `isGet()` and tests `query_string` with the
  ActiveSupport `blank?` analogue.
- The `get?` row is deleted from
  `call-mismatches-exclude/actioncontroller/test-case.json`, and
  `pnpm parity:api:calls` (plus `:tighten` if needed) is green.
