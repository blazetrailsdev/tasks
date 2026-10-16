---
rfc: "0166-actiondispatch-system-testing-parity"
title: "ActionDispatch system testing — SystemTestCase, Driver, Browser and Server, native to Vite and Vitest"
status: active
created: 2026-09-27
updated: 2026-10-16
owner: "@deanmarano"
packages:
  - "actionpack"
  - "trailties"
clusters: []
---

# RFC 0166 — ActionDispatch system testing, native to Vite and Vitest

## Summary

Port `action_dispatch/system_test_case.rb` and `action_dispatch/system_testing/**`
(`Driver`, `Browser`, `Server`, `TestHelpers::ScreenshotHelper`,
`TestHelpers::SetupAndTeardown`) at their Rails names, and port the four
`test/dispatch/system_testing/*_test.rb` files, on the toolchain trails
already runs: Vitest for the test lifecycle and assertions, Vite for serving
the application and its assets, and Playwright for the browser.

Rails builds system testing on a third-party browser-session library. **trails
does not port that library, vendor it, or use any of its names, registries or
environment variables** (repo-owner ruling, 2026-10-15). Each place Rails'
system-testing files hand state to it is ported onto the Vitest, Vite or
Playwright mechanism that holds the same fact, and that substitution is a
ratified deviation (§ "The ratified section").

This is one of eight actionpack RFCs (0160–0167; RFC 0167 owns measurement
fixes and gate enrollment).

## Motivation

### Measured state, 2026-09-27

trails `main` @ `114cf8364c`, after `pnpm build` and
`API_COMPARE_FORCE=1 pnpm parity:api`. Unchanged by this rewrite.

- **`system_testing/browser.rb` is absent:** 0/9 (`browser.rb:10-65`).
- **Arity:** the four `Driver#register_*(app)` arms (`driver.rb:55-69`) take
  `app` and trails' take none; `Server#set_server()` takes none and trails'
  takes `(app, callback)`; `SystemTestCase.start_application()`
  (`system_test_case.rb:128`) takes none and trails' takes `(app)`.
- **Inheritance:** `SystemTestCase < ActiveSupport::TestCase`
  (`system_test_case.rb:114`); trails' has no parent.
- **Extra surface:** `system-testing/server.ts` moved `host`, `port`, `stop`;
  `driver.ts` has `newContext`, `newPage`, `close`.
- **Call baselines:** `actiondispatch/system-testing/driver.json` 9,
  `system-testing/server.json` 2,
  `system-testing/test-helpers/screenshot-helper.json` 2,
  `system-test-case.json` 1.
- **Tests:** `driver_test.rb` 0/18, `server_test.rb` 0/3,
  `system_test_case_test.rb` 0/6, and `screenshot_helper_test.rb` 17/17 by
  name, all under the wrong describe.
- **Third-party names in trails today:** `screenshot-helper.ts:85,132` read two
  third-party environment variables, its test stubs one, and trailties'
  devcontainer generator writes a third (`devcontainer-generator.ts:141,246`).
  All go.

### Toolchain on hand

vitest 3.2.4, vite 5–7 (trailties on 7, with a Rack-mounting dev plugin at
`packages/trailties/src/server/vite-plugin.ts`), playwright 1.60 (actionpack's
optional peer). `@vitest/browser` is not installed and this design does not
need it (§ "Where test code runs").

## Design

### Where test code runs: Node

**The test body runs in a Node Vitest worker. The browser is driven from
Node.** Recorded as a design decision; the alternatives are below.

A system test's body creates and reads records (`Post.create!`, fixtures,
`assert_equal 1, Post.count`) between browser steps. Those need the database
connection, the model classes and transactional fixtures, all of which live
in Node. Rails gets one more property for free that the design must keep:
Puma runs in-process and shares the test's connection, so rows a test writes
inside its fixture transaction are visible to the requests the browser makes.

- **Node (chosen).** The Vitest worker holds the connection and fixtures,
  starts the application server in the same process (so the shared
  transaction is visible to app requests, as in Rails), and drives the
  browser through Playwright. `ActiveSupport::TestCase`'s existing mapping
  onto Vitest's `beforeEach` / `afterEach` (`activesupport/src/testing/autorun.ts`)
  is the lifecycle, unchanged.
- **Vitest browser mode with `commands` (rejected).** Browser mode runs the
  test file inside the browser, in an iframe of Vitest's tester page. Every
  model call and fixture read would become a `commands` RPC to Node, the
  fixture transaction would sit on the far side of that RPC, and the
  application under test — a separate server-rendered origin, navigated as a
  whole page — cannot be driven from inside a cross-origin iframe. Browser
  mode is built for components in Vite's module graph; a Rails system test is
  not one.

What the test author sees is still Vitest's browser API, not a new one:

- **`page`** — a Playwright `Page`, whose `getByRole` / `getByText` /
  `getByLabel` / `getByPlaceholder` / `getByTestId` locators are the API
  Vitest browser mode exposes (Vitest's locators are modeled on Playwright's).
- **`expect.element(locator)`** — the retrying assertion entry point, named
  and shaped as in `@vitest/browser` (`toBeVisible`, `toHaveTextContent`,
  `toBeInTheDocument`, `toHaveValue`, …), registered on Node-side `expect`
  and polling with `expect.poll`'s timeout semantics.
- Navigation goes through the ported url helpers and `page.goto`.

No finder, matcher or action DSL is ported from the library Rails includes at
`system_test_case.rb:115-116`; Vitest's locators and `expect.element` are that
surface.

### Where each Rails fact lands

| Rails writes (`system_test_case.rb`, `system_testing/**`) | trails carrier                                                   |
| --------------------------------------------------------- | ---------------------------------------------------------------- |
| driver registration under `name` (`driver.rb:41`)         | module-private launcher memo in `driver.ts`, keyed by `name`     |
| current driver (`driver.rb:81`)                           | `SystemTestCase.driver` (`.name`), the class attribute           |
| application (`system_test_case.rb:129`)                   | Rack app mounted in an in-process Vite dev server                |
| server choice / silence (`server.rb:25`)                  | Vite dev server, `logLevel: "silent"` from `Server.silence_puma` |
| always include port (`server.rb:29`)                      | the Vite server's resolved URL, which always carries its port    |
| server host / port (`system_test_case.rb:168-169`)        | Vite `server.host` / `server.port`                               |
| app host (`system_test_case.rb:185`)                      | configured host, else the Vite server URL, else `DEFAULT_HOST`   |
| screenshot save path (`screenshot_helper.rb:95`)          | `ScreenshotHelper.screenshotDirectory`, seeded from `inject`     |
| inline screenshot env (`screenshot_helper.rb:122`)        | `RAILS_SYSTEM_TESTING_SCREENSHOT` only                           |
| session reset (`setup_and_teardown.rb:16`)                | close the test's browser context in `after_teardown`             |
| test `metadata` (`screenshot_helper.rb:57`)               | the Vitest task's `meta`                                         |

### Driver: Rails' four types, on what Vitest itself drives

`Driver` keeps `initialize` / `use` / `registerable?` / `register` /
`browser_options` / `register_*(app)` / `setup` line for line. The arms:

- `:playwright` — Playwright launch, `screen` / `viewport` from `screen_size`.
- `:selenium` — **deferred** (repo owner, 2026-10-15: Playwright first). Until
  `converge-driver-selenium-arm-onto-webdriverio` lands, `register_selenium`
  raises `NotImplementedError`. That story ports it onto `webdriverio`, the
  package behind Vitest's `webdriverio` provider.
- `:cuprite` — Chrome over CDP through Playwright's `chromium`.
- `:rack_test` — no browser; `page` is a `rack-test` session against the app
  (trails already ports `rack-test`), and `supports_screenshot?` is false.

`SystemTestCase` keeps Rails' default, `driven_by(:selenium)`; until the
selenium arm lands, test classes and the generated application test case
call `drivenBy("playwright")`.

### Browser: launch options, not Selenium options

`Browser` builds the Playwright `LaunchOptions` object (the `launch` key of a
Vitest playwright-provider instance): `type`, the `--headless` /
`--disable-search-engine-choice-screen` / `-headless` arguments, `configure`
yielding them to the capabilities block, and `preload` resolving the browser
executable through Playwright where Rails uses `DriverFinder`.

### Server: an in-process Vite dev server

`start_application()` mounts the application under `"/"` and runs
`Server.new.run`; `set_server` creates a Vite dev server in the worker (Vite
also serves the app's assets from source, as in development) and `set_port`
fixes the URL's port. Shutdown runs from a Vitest `afterAll`.

### Lifecycle and screenshots

`SetupAndTeardown#before_teardown` / `after_teardown` already run inside
Vitest's `afterEach` through `ActiveSupport::TestCase`. `failed?` reads the
Vitest task result, the failure screenshot path lands in task `meta`, and a
`system` Vitest project (`*.system.test.ts`, `forks`, one browser per worker)
keeps browser tests out of the unit lanes.

### The ratified section

Story `ratify-vitest-native-system-testing-section` adds this to
`packages/actionpack/CLAUDE.md`, with a pointer heading in the root file:

> **System testing runs on Vitest (`SystemTestCase`, `SystemTesting::*`).**
> Rails' system-testing files hand driver, server, session and screenshot
> state to a third-party browser-session library. trails does not port it
> and uses none of its names, registries or environment variables; this was
> ruled by the repo owner on 2026-10-15. Each such call is ported onto the
> Vitest, Vite or Playwright mechanism that holds the same fact (the table
> in RFC 0166), test code runs in a Node Vitest worker, and the interaction
> surface is a Playwright `page` with Vitest's `expect.element`. Code
> carrying a receipt for this cites this section, and a new instance is not
> a new decision to argue.

This is an owner ruling, not a TypeScript language shortcoming; the section
says so, and receipts are `PERMANENT`.

## Non-goals

- Any port, vendoring or name of the third-party session library Rails
  builds on, or of Selenium's Ruby client.
- Vitest browser mode as the test runtime (rejected above); adopting
  `@vitest/browser` itself is not required.
- Cuprite, beyond the `:cuprite` arm launching Chrome over CDP.
- Webkit and webdriverio in the default CI lane.

## Alternatives considered

- **Port the session library as its own package** (this RFC's first draft). Ruled
  out by the repo owner.
- **Vitest browser mode, test code in the browser.** Rejected in § "Where test
  code runs".
- **Playwright Test (`@playwright/test`) as the runner.** A second test runner
  beside Vitest, with its own lifecycle and `expect`, outside
  `ActiveSupport::TestCase`.

## Rollout

1. Decision — `ratify-vitest-native-system-testing-section`
2. Ports — `port-system-testing-browser-onto-playwright-launch-options`,
   `converge-driver-onto-vitest-native-drivers`,
   `converge-server-onto-in-process-vite-dev-server`
3. Surface — `converge-system-test-case-onto-test-case-with-page-and-expect-element`,
   `screenshot-helper-test-describe-and-helper-call-rows`
4. Tests and tooling — `port-system-testing-driver-test`,
   `port-system-testing-server-and-system-test-case-tests`,
   `system-test-vitest-project-ci-lane-and-generator`

## Verification

- `pnpm parity:api --package actiondispatch` reports `system_testing/browser.rb`
  9/9 and every `system_test*` row at 100%, with no arity or inheritance row.
- `pnpm parity:api:extra --package actiondispatch` lists no unreceipted
  `system-testing/` name; `page` and `expect.element` carry `PERMANENT`
  receipts citing the ratified section.
- No unreceipted row remains in the four system-testing call baseline shards.
- `pnpm parity:test --package actiondispatch` reports all four
  `dispatch/system_testing/*_test.rb` files complete.
- No third-party session-library name or environment variable remains in
  `packages/` (checked by grep in the last story's PR).

## Open questions

None open. Resolved 2026-10-15 by the repo owner:

1. **`:selenium`** is deferred; Playwright first. Tracked by
   `converge-driver-selenium-arm-onto-webdriverio`.
2. **The Rails test name that spells the library** is renamed through a
   `conventions.ts` token rename (`capybara` → `vitest`), as `erb` → `tse`
   (trails#8948).

## Changelog

- 2026-09-27: initial RFC (session-library-port design).
- 2026-10-15: rewritten. Repo-owner ruling: no third-party session library. Redesigned on Vitest,
  Vite and Playwright with test code in Node; the five library-premised
  stories closed `FALSIFIED`, six new stories filed, three rewritten.
- 2026-10-15: Playwright first; the `:selenium` arm deferred to its own story.
  The library-named test name is token-renamed (trails#8948).
