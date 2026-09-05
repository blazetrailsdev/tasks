---
title: "active-model-secure-password-reads-trails-env"
status: draft
updated: 2026-09-05
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`activemodel/lib/active_model/railtie.rb:17-19` is:

```ruby
initializer "active_model.secure_password" do
  ActiveModel::SecurePassword.min_cost = Rails.env.test?
end
```

`packages/trailties/src/trailties/active-model.ts` instead calls a private
static with no Rails counterpart:

```ts
this.initializer("active_model.secure_password", () => {
  SecurePassword.minCost = Trailtie.detectEnv() === "test";
});

private static detectEnv(): string {
  return processEnv.TRAILS_ENV || "development";
}
```

`Trails.env` exists and returns an `EnvironmentInquirer`
(`packages/trailties/src/rails.ts:62`, mirroring `railties/lib/rails.rb:72-74`),
so the Rails spelling is available — `Trails.env.isTest()` is the direct port of
`Rails.env.test?`. `detectEnv` also reimplements the default (`"development"`)
that `Rails.env` already owns, so the two can drift.

The likely reason it was written this way is the module-eval cycle:
`trailties/active-model.ts` importing `rails.ts` closes a loop through
`application.ts`. `packages/trailties/src/trails-slot.ts` is the sanctioned
zero-import slot for exactly that constant (see CLAUDE.md, "Call-time constant
resolution"), and `engine/lazy-route-set.ts` already reads `Trails` through it.

PR #7503 inlined this railtie's `static initialize` and left `detectEnv` in
place as out of scope.

## Converged shape

`active_model.secure_password` reads `Trails.env` — through
`trails-slot.ts` if a plain import closes a cycle, verified against the built
`dist/**.js` as entry modules rather than a vitest run — and `detectEnv` is
deleted.

## Acceptance criteria

- [ ] `detectEnv` is gone from `packages/trailties/src/trailties/active-model.ts`.
- [ ] The initializer reads `Trails.env`, so `Rails.env` and the railtie cannot
      disagree about the default environment.
- [ ] The existing Rails test names in `active-model.test.ts` ("secure password
      min_cost is false in the development environment" / "... true in the test
      environment", `activemodel/test/cases/railtie_test.rb:22-33`) still pass,
      set through whatever `Trails.env` honours.
