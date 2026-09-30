---
title: "Enroll Thor's RSpec suite in parity:test as a nested pseudo-package, and record Thor's non-ports"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 400
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8269 vendored thor v1.3.2 (`vendor/sources.ts:269-281`) and enrolled
`packages/trailties/src/thor/` as an **api-compare** pseudo-package
(`PACKAGE_DIR_OVERRIDES.thor = "trailties"` and `PACKAGE_SRC_SUBDIR.thor = "thor"`,
`scripts/api-compare/config.ts:47,111`; `MANIFEST_PACKAGES`, `:200`). It did
not enroll the specs: the `thor` source entry has no `testPath`, so
`pnpm parity:test` has no thor block.

The test extractor already reads RSpec. rack-test's specs are `describe` / `it`
and are scored today. Run over `vendor/thor/v1.3.2/spec`, the unmodified extractor reports:

```console
$ TEST_PATHS_JSON='{"thor":"'$PWD'/vendor/thor/v1.3.2/spec"}' ruby scripts/test-compare/extract-ruby-tests.rb
  thor: 36 files, 868 tests
```

A **nested** pseudo-package is new to test-compare, though. Every test-compared
package owns `packages/<pkg>/src/**/*.test.ts`
(`scripts/test-compare/extract-ts-tests.ts:14-40`), so as things stand, trailties'
glob would also count every `src/thor/**/*.test.ts`. Only actionpack's
subpackages are carved out, and actionpack itself is not in the list.

Registrations (memory: test-compare enrollment needs four, and `pnpm parity:test`
passes without the fourth):

1. `vendor/sources.ts`: `testPath: "spec"` on the thor package, plus the
   `vendor/sources.test.ts` key lists.
2. `extract-ts-tests.ts`: a `thor` entry globbing `packages/trailties/src/thor/**/*.test.ts`,
   with trailties' glob **excluding** `src/thor/`, so each file is counted once.
3. `compare.ts` `PKG_SRC_DIRS.thor = "packages/trailties/src/thor/"`, and
   `generate-stubs.ts`'s twin map.
4. A sorted, hand-added `0/0/0` `thor` row in
   `scripts/test-compare/assertion-mismatch-mark.json`. Do not reseed.
5. `rubyToConventionTs`: `actions/create_file_spec.rb` → `actions/create-file.test.ts`,
   `parser/options_spec.rb` → `parser/options.test.ts`, `thor_spec.rb` → `thor.test.ts`.
   Widen the rack-test `_spec` branch (`compare.ts:139`). Do not write a second branch.

**Non-ports.** Add `scripts/parity/unported-files/thor.ts` (`THOR_UNPORTED_FILES`, spread
into `index.ts`). Each entry's `reason` is the RFC's Non-goals wording:

- lib `pattern`s: `runner.rb` (the `thor` executable's Thorfile installer), `rake_compat.rb`,
  `shell/html.rb`, `shell/lcs_diff.rb` (needs the unvendored `diff-lcs` gem; `Color#show_diff`
  falls back to `Basic#show_diff`, `basic.rb:313-322`), `line_editor/readline.rb`;
- `testFile`s: `runner_spec.rb` (33), `rake_compat_spec.rb` (8), `shell/html_spec.rb` (6),
  `line_editor/readline_spec.rb` (7), `quality_spec.rb` (2, source whitespace lint),
  `no_warnings_spec.rb` (2, `ruby -w`), `encoding_spec.rb` (3, `load_thorfile`),
  `script_exit_status_spec.rb` (2, spawns `bin/thor`);
- per-test entries: `util_spec.rb`'s `#namespaces_in_content` (2), `#user_home` (6),
  `#thor_root_glob` (1), `#globs_for` (1); `line_editor_spec.rb`'s
  "on a system with Readline support" case (1); `base_spec.rb`'s `#subclass_files` (2);
  `shell/color_spec.rb`'s "#file_collision when a block is given invokes the diff command" (1,
  `LCSDiff`).

Members of ported files that stay unported go in `SCOPED_SKIP_GROUPS`
(`scripts/parity/conventions.ts:696`), scoped to `thor/util.rb`
(`namespaces_in_content`, `load_thorfile`, `user_home`, `thor_root`, `thor_root_glob`,
`globs_for`, `escape_html`, `Sandbox`) and `thor/base.rb` (`subclass_files`: Runner-only,
keyed by `caller` file).

**Boundary.** Thor depends on nothing but Ruby's stdlib (`thor.gemspec`). Add an
import-boundary lint over `packages/trailties/src/thor/**`: no import from `../` outside
`thor/`, and no `@blazetrails/*` other than `ruby-compat` and `did-you-mean`.
`rails-private-jsdoc` enrollment for `src/thor/` is added to both config files, which must
stay in sync.

## Acceptance criteria

- [ ] `pnpm parity:test` prints a `thor` block with 868 Ruby cases. The 77 unported cases
      read as unported with their reasons, and 791 are portable.
- [ ] Moving `packages/trailties/src/thor/actions.test.ts` into the thor block does not
      change trailties' matched count except by that file's 6 cases.
- [ ] `pnpm parity:test:assertions` is green with the hand-added row, and no other row moves.
- [ ] The boundary lint fails a scratch import of `../generators/base.js` from `src/thor/`.

## Definition of done

A reseed of the assertion mark, or a `SKIP_GROUPS` (unscoped) entry for a Thor member,
does not close this story.
