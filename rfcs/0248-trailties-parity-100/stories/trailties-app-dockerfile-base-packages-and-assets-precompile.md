---
title: "trailties-app-dockerfile-base-packages-and-assets-precompile"
status: ready
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
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

`test_dockerfile` (`vendor/rails/v8.0.2/railties/test/generators/app_generator_test.rb:1226-1235`) asserts the generated Dockerfile runs `assets:precompile` and installs `libvips`. Rails' template (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/Dockerfile.tt:19,94`) installs `dockerfile_base_packages` (`app_base.rb:582-596`: curl, database base package, libvips unless skip_active_storage, libjemalloc2) in the base stage and builds assets with `./bin/rails assets:precompile`. trails' `packages/trailties/lib/generators/trails/app/templates/Dockerfile.tt` installs only build packages and runs `pnpm run build`; `@blazetrails/vite-assets` already defines/enhances `assets:precompile` (`packages/vite-assets/lib/tasks/vite.rake.ts:88-104`). Left unported by trailties-test-app-generator-part-3.

## Acceptance criteria

- [ ] Port `dockerfile_base_packages` / `dockerfile_build_packages` onto `app-base.ts` and use them in `Dockerfile.tt` as Rails does.
- [ ] The build stage runs `./bin/trails assets:precompile`.
- [ ] Port `test_dockerfile` into `packages/trailties/test/generators/app-generator.test.ts` (`describe("AppGeneratorTest")`), the `yarn` assertion included.
