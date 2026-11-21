---
title: "dir-chdir-restores-renamed-cwd-for-app-folder-renamed-test"
status: in-progress
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10528
claim: "2026-11-21T21:57:40Z"
assignee: "app-generator-css-tailwind-writes-tailwindcss-vite"
blocked-by: null
closed-reason: null
---

## Context

`test_application_name_is_detected_if_it_exists_and_app_folder_renamed`
(`vendor/rails/v8.0.2/railties/test/generators/app_generator_test.rb:154-163`) generates `myapp`,
`FileUtils.mv`s it to `myapp_moved`, then `run_app_update(app_moved_root)`. `create_root`
(`app_base.rb:257-262`) leaves the process cwd inside `myapp`. Ruby's `Dir.chdir` block saves
`getcwd`, which after the rename answers the moved path. In trails `Dir.chdir`
(`packages/ruby-compat/lib/process-adapter.ts:~911`) restores the stale `myapp` path, and the test
fails with `ENOENT: chdir 'myapp_moved' -> 'myapp'`. It was left unported by the
app-generator part-1/2 bundle.

## Acceptance criteria

- [ ] ruby-compat `Dir.chdir`'s saved/restored cwd matches MRI `dir_s_chdir` (`vendor/ruby/v3.3.11/dir.c`) after the cwd is renamed.
- [ ] `it("application name is detected if it exists and app folder renamed")` ported with the Rails body, passing.
