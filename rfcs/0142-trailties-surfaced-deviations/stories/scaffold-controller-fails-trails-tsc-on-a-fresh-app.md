---
title: "scaffold-controller-fails-trails-tsc-on-a-fresh-app"
status: in-progress
updated: 2026-09-29
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#8250
claim: "2026-09-29T19:05:03Z"
assignee: "scaffold-controller-fails-trails-tsc-on-a-fresh-app"
blocked-by: null
closed-reason: null
---

## Context

After `trails new blog && bin/trails generate scaffold Post title:string body:text`,
the app's own `pnpm build` (`trails-tsc --schema db/schema.ts`) fails on the
generated controller:

```text
app/controllers/posts-controller.ts(26,5): error TS2740: Type 'Post[]' is missing the following properties from type 'Post' ...
app/controllers/posts-controller.ts(26,26): error TS2769: No overload matches this call. Argument of type 'unknown' is not assignable to parameter of type 'Record<string, unknown> | undefined'.
app/controllers/posts-controller.ts(36,32): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'Record<string, unknown>'.
```

The scaffold emits `private postParams(): unknown` (see
`packages/trailties/src/generators/rails/scaffold/__snapshots__/scaffold-emit.test.ts.snap:55`).
Rails' template is `params.expect(post: [ ... ])`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/scaffold_controller/templates/controller.rb.tt:56-60`).
`Post.new(unknown)` then resolves to the array overload of `Base.new`
(`packages/activerecord/src/base.ts:1435-1451`), and `update(unknown)` does not type-check.
The fix is either a typed return from `ActionController::Parameters#expect`
or the emitted `*Params()` signature. Pick the one that keeps the Rails shape.

Found re-running the root README quickstart (PR #8195) on `main` at `c19bfc0aee`.

## Acceptance criteria

- [ ] `trails new` + `generate scaffold` + `pnpm build` exits 0.
- [ ] A generator test type-checks the emitted controller against the scaffolded
      model, so a regression is red.
