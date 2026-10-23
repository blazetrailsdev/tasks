---
title: "Run the README quickstart end to end in CI"
status: draft
updated: 2026-10-23
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
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

The root README quickstart (`README.md` § Quickstart) is verified only by hand. Re-running it for trails#8195 on `9a59b3b073` found three regressions that no CI job caught (fixed in #9279): a generated `package.json` missing `@blazetrails/activejob` (`packages/trailties/src/generators/app-generator.ts:233-243`), the dev server answering a static 500 for `InvalidAuthenticityToken` / routing errors, and a wrong `trails-tsc` missing-table warning. It also missed README drift from #9019 (the generated model's `static toString()`).

The existing `packages/activerecord-cli/src/__e2e__/` tests call `run()` in-process inside the workspace, so they cannot see a dependency missing from a generated app's `package.json`. Catching that class needs the real binaries in a fresh directory with a real install.

## Acceptance criteria

- A script (e.g. `scripts/quickstart/run.sh`) runs the README steps in a temp directory: `trails new`, the pnpm `overrides` snippet, `pnpm install`, `generate scaffold Post title:string body:text`, `db:migrate`, `script/hello.ts`, `routes`, `console` over stdin.
- It starts `bin/trails server` and asserts: the four scaffold pages answer 200; create / update / destroy through the forms with the CSRF token answer 302 / 303 / 303 with their notices; an empty title under `validates("title", { presence: true })` answers 422 with the error markup; a POST without a valid token answers 422 with the `InvalidAuthenticityToken` debug page; `GET /nope` answers 404.
- It runs the app's `pnpm build` and fails on any `trails-tsc: warning`, checks the README's `check.ts` type error, and runs `pnpm test` (7 passed, 1 todo).
- Generated files and printed output are compared with the README's blocks (timestamps and tokens normalized), so README drift reds too.
- A CI job ("Quickstart", Node 24, SQLite) runs it on changes under `packages/**`.
