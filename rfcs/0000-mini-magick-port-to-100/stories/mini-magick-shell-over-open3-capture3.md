---
title: "Run mini_magick's commands through Open3.capture3, async from Shell up"
status: ready
updated: 2026-10-22
rfc: "0000-mini-magick-port-to-100"
cluster: mini-magick-runtime
packages: ["mini-magick"]
deps: ["mini-magick-land-on-main", "ruby-compat-open3-capture3"]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`MiniMagick::Shell` (`vendor/mini_magick/v5.2.0/lib/mini_magick/shell.rb`):

- `#execute` (`:29-40`) builds the environment (`ENV.slice("HOME", "PATH", "LANG")`
  under `restricted_env`, merges `cli_env`, sets `MAGICK_TIME_LIMIT` from
  `timeout`), runs `Open3.capture3(env, *command, stdin_data:, unsetenv_others:)`
  inside `log`, and answers `[stdout, stderr, status&.exitstatus]`, or
  `["", "executable not found: …", 127]` on `Errno::ENOENT` / `IOError`.
- `#run` (`:13-27`) raises `TimeoutError` / `Error` by status and stderr, and
  prints stderr to `$stderr` under `warnings`.
- `#log` (`:44-49`) times the block with `Benchmark.realtime` and logs it at
  debug.

A spawned process is async in Node, so `execute`, `run`, `Tool#call`
(`tool.rb:80`) and every `Image` method that runs a tool are async (ruled
2026-10-21: the port shells out as Ruby does). The generated `shell.ts` calls a
`capture3` ruby-compat lacks and awaits nothing.

## Acceptance criteria

- `Shell#execute` runs the argv through ruby-compat's `Open3.capture3`, with
  `run`, `log`, `Tool#call` and their callers in `image.rb` / `image/info.rb`
  async and awaited.
- The `MAGICK_TIME_LIMIT` timeout and `"time limit exceeded"` → `TimeoutError`
  arm are ported as Ruby has them.
- `shell.test.ts` passes against the CI runner's ImageMagick; `tool.test.ts`'s
  `#call` examples pass.
