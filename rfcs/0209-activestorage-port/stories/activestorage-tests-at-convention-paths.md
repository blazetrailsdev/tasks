---
title: "Move activestorage tests to their Rails convention paths"
status: draft
updated: 2026-11-04
rfc: "0209-activestorage-port"
cluster: null
packages: ["activestorage"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test -- --package activestorage` on origin/main `835c4bd7fc` scores activestorage at 27.5%: 128 of 451 Rails tests matched, **317 misplaced**. The tests are ported but sit at `packages/activestorage/src/<name>.test.ts`. The convention path mirrors Rails' `test/<dir>/<name>_test.rb`. A misplaced test is never credited `matched` (`scripts/test-compare/compare.ts`, `misplacedLocation`).

| Rails file                                    | current TS                        | convention TS                                 | tests |
| --------------------------------------------- | --------------------------------- | --------------------------------------------- | ----- |
| models/attached/one_test.rb                   | attached/one.test.ts              | models/attached/one.test.ts                   | 86    |
| models/attached/many_test.rb                  | attached/many.test.ts             | models/attached/many.test.ts                  | 75    |
| models/blob_test.rb                           | blob.test.ts                      | models/blob.test.ts                           | 40    |
| models/variant_test.rb                        | variant.test.ts                   | models/variant.test.ts                        | 27    |
| models/attachment_test.rb                     | attachment.test.ts                | models/attachment.test.ts                     | 19    |
| controllers/disk_controller_test.rb           | disk-controller.test.ts           | controllers/disk-controller.test.ts           | 14    |
| models/preview_test.rb                        | preview.test.ts                   | models/preview.test.ts                        | 11    |
| models/filename_test.rb                       | filename.test.ts                  | models/filename.test.ts                       | 9     |
| models/variant_with_record_test.rb            | variant-with-record.test.ts       | models/variant-with-record.test.ts            | 9     |
| controllers/direct_uploads_controller_test.rb | direct-uploads-controller.test.ts | controllers/direct-uploads-controller.test.ts | 5     |
| models/representation_test.rb                 | representation.test.ts            | models/representation.test.ts                 | 5     |
| jobs/transform_job_test.rb                    | transform-job.test.ts             | jobs/transform-job.test.ts                    | 4     |
| models/reflection_test.rb                     | reflection.test.ts                | models/reflection.test.ts                     | 4     |
| jobs/preview_image_job_test.rb                | preview-image-job.test.ts         | jobs/preview-image-job.test.ts                | 2     |
| jobs/purge_job_test.rb                        | purge-job.test.ts                 | jobs/purge-job.test.ts                        | 2     |
| models/presence_validation_test.rb            | presence-validation.test.ts       | models/presence-validation.test.ts            | 2     |
| models/strict_loading_test.rb                 | strict-loading.test.ts            | models/strict-loading.test.ts                 | 2     |
| jobs/analyze_job_test.rb                      | analyze-job.test.ts               | jobs/analyze-job.test.ts                      | 1     |

(All paths are relative to `packages/activestorage/src/`.)

## Acceptance criteria

- Each file above is moved (`git mv`) to its convention path, with relative imports fixed. Test bodies stay as they are.
- `.trails.test.ts` siblings stay where they are; they are not Rails-mapped.
- `pnpm parity:test -- --package activestorage` reports 0 misplaced and ≥445 matched.
- `packages/activestorage` tests stay green on every adapter lane.
