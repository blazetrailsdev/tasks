---
title: "Playground runs trails generators and offers more than one example app"
status: claimed
updated: 2026-11-26
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: "2026-11-26T10:44:44Z"
assignee: "playground-bundle-size-and-unused-mailer-chunk"
blocked-by: null
closed-reason: null
---

## Context

Follow-ups to the playground (`examples/browser-sqlite`) that trails#10753 listed as not done:

- **Generators.** The page can create a file from a skeleton (`src/host/main.ts`, `starter`), but cannot run `trails generate scaffold` / `model` / `migration`. The generators are Thor commands in `@blazetrails/trailties` that write through the fs adapter, which the playground already replaces with its virtual filesystem (`src/runtime/vfs.ts`).
- **Example apps.** The only app is the blog in `template/`. The host loads it with `import.meta.glob("../../template/**/*")`.

## Acceptance criteria

- A "Generate" control runs a real trails generator (at least `model`, `migration`, `scaffold`) in the runtime against the virtual filesystem and the new files appear in the tree. If a generator cannot run in the browser, the PR says what blocks it and files that.
- A picker switches between at least two example apps (the blog, and one more that shows something the blog does not: an API-only app, or one centred on associations and validations), each with its own stored files and database.
- `pnpm smoke` covers generating a model and switching examples.
