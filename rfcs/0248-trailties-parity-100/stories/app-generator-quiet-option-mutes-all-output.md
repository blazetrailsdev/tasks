---
title: "app-generator-quiet-option-mutes-all-output"
status: claimed
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-21T21:57:40Z"
assignee: "app-generator-css-tailwind-writes-tailwindcss-vite"
blocked-by: null
closed-reason: null
---

## Context

`test_quiet_option` (`vendor/rails/v8.0.2/railties/test/generators/app_generator_test.rb:768-771`) runs
`run_generator [File.join(destination_root, "myapp"), "--quiet"]` and asserts the output is empty.
In trails `AppGenerator.start([..., "--quiet"])` still prints `create  config/master.key` and further
status lines, so the test was left unported by the app-generator part-1/2 bundle. `masterKey`
(`packages/trailties/lib/generators/trails/app/app-generator.ts`) passes `quiet` the way
`app_generator.rb:179-186` does, so the leak is in how `--quiet` reaches the shell / sub-generators.

## Acceptance criteria

- [ ] `it("quiet option")` ported into `packages/trailties/test/generators/app-generator.test.ts` with the Rails body, passing.
- [ ] The lib fix mirrors the Rails/Thor path that mutes status output under `--quiet`.
