---
title: "ruby-compat env is writable, as Ruby's ENV is"
status: draft
updated: 2026-11-18
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

Ruby's `ENV` is a writable hash: `ENV["X"] = "v"` (`ENV.[]=`, `rb_env_aset`, `vendor/ruby/v3.3.11/hash.c`) and `ENV.delete("X")` change it for the rest of the process. Rails and app tests rely on this. trailmap's Rails twin (`rails/test/controllers/ingest_token_test.rb`, trailmap#163) sets and restores `ENV["TRAILMAP_INGEST_TOKEN"]` in setup and teardown.

trails exports `env` as `envInternal as Readonly<Record<string, string | undefined>>` (`packages/ruby-compat/lib/process-adapter.ts:80`). So the TS port of that same test cannot write `env.X = "v"` (TS2542, index signature only permits reading). trailmap#163 worked around it with `Object.assign(env, { X: "v" })` and `Reflect.deleteProperty(env, "X")`. The object is mutable at run time, and only the type forbids the write. `vi.stubEnv` does not reach it either, because `env` is a copy seeded from the adapter and not a view of `process.env`.

## Acceptance criteria

- [ ] `env` is typed writable, as Ruby's `ENV` is. `env.X = "v"` and `delete env.X` typecheck and take effect for later `env.X` reads.
- [ ] Ruby `ENV#[]=` with a `nil` value deletes the key (`rb_env_aset`); the port mirrors that arm, or the typed write rejects `undefined`.
- [ ] trailmap's `test/controllers/ingest-token.test.ts` and `rfc-refinements.test.ts` can drop their `Object.assign` / `Reflect.deleteProperty` workaround (follow-up in trailmap, noted here).
