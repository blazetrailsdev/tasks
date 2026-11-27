---
title: "trailties-tests-regressed-while-lane-ran-no-files"
status: ready
updated: 2026-11-27
rfc: "0061-ci-failures"
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

trails#10835 revives the Trailties lane. Since 2f2c330619 (#10804) its vitest step had exited 0 having run no files, so the PRs merged in between landed untested. Run 46038973288 then reported the failures below. trails#10835 skips each of them under `// BLOCKED: trailties-tests-regressed-while-lane-ran-no-files`. Every one of them passed on main at 625f16e67b, the last run where the lane ran.

- `test/application/loading.test.ts` > LoadingTest: "columns migrations also trigger reloading", "dependencies reloading is followed by routes reloading" (`expected 'NaN' to be '7'`, `:292`), "routes reloading triggers after_routes_loaded" (`:667`, got the welcome page instead of `BODY`).
- `test/application/test-runner.test.ts` > "declarative style string filter" (`:474`, `1 runs, 0 failures` not matched).
- `test/application/zeitwerk-integration.test.ts` (#10830): "autoloaders inflect with Active Support", "the once autoloader can autoload from initializers", "reloading clears autoloaded tracked classes" (each times out after ~30s locally). trails#10835 also fixes the file's import of the unexported `@blazetrails/activesupport/descendants-tracker` value.
- "Did you mean?" suggestions, which are missing on the CI runner but pass locally: `test/commands/server.test.ts` "using server mistype" (`:214`), `test/generators.test.ts` "generator suggestions" and "generator suggestions except en locale" (`:98`, `:109`), `test/command/help-integration.test.ts` "prints helpful error on unrecognized command" (`:32`).
- `test/paths.trails.test.ts` > Annotation > "falls back to the regexp without typescript".
- `test/trailties/action-mailer-boot.trails.test.ts` > "loads ActionMailer::Base at boot once routes are lazy" (`:17`, `expected undefined to be defined`).

## Acceptance criteria

- For each test, bisect `625f16e67b..HEAD` to the commit that broke it, and converge the code, not the test, to the Rails behaviour its name cites.
- Remove every `BLOCKED: trailties-tests-regressed-while-lane-ran-no-files` skip, with the Trailties lane green.
