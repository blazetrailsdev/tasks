---
title: "file-exist-takes-a-to-path-argument"
status: draft
updated: 2026-10-11
rfc: "0154-ruby-compat-surfaced-deviations"
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

`RenderFile::TestBasic` "rendering a Pathname"
(`vendor/rails/v8.0.2/actionpack/test/controller/new_base/render_file_test.rb:13-15,26-29`)
calls `render file: Pathname.new(__dir__).join(...)`. It is parked as `it.skip` under
`BLOCKED: file-exist-takes-a-to-path-argument` in
`packages/actionpack/src/action-controller/controller/new-base/render-file.test.ts`.

`TemplateRenderer#determine_template`
(`vendor/rails/v8.0.2/actionview/lib/action_view/renderer/template_renderer.rb:29-35`) hands
`options[:file]` straight to `File.exist?` and, on a miss, `File.absolute_path?`. MRI converts
the argument with `rb_get_path` / `FilePathValue` in both (`rb_file_exist_p`,
`vendor/ruby/v3.3.11/file.c:1806`; `rb_file_s_absolute_path_p`, `file.c:4210`), so a
`Pathname` (anything answering `to_path`) is accepted.

ruby-compat's `File.isExist` and `File.isAbsolutePath` (`packages/ruby-compat/src/file.ts`)
take `string` only and pass it to the fs backend, so a `Pathname` raises
`TypeError: The "path" argument must be of type string` from
`packages/actionview/src/renderer/template-renderer.ts:46`, which casts `options.file as string`.

The skipped test body builds the `Pathname` with `File.join` because `Pathname#join` is
unported; `ruby-compat-pathname-join-and-file-join-to-path` owns that half.

## Acceptance criteria

- [ ] `File.isExist` and `File.isAbsolutePath` accept an argument answering `toPath`, with the
      MRI `rb_get_path` citation.
- [ ] `template-renderer.ts` drops the `as string` casts on `options.file`.
- [ ] "rendering a Pathname" in `new-base/render-file.test.ts` is un-skipped and passes; once
      `ruby-compat-pathname-join-and-file-join-to-path` lands its body uses `Pathname#join`
      as Rails' does.
