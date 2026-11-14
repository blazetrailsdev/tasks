import { Migration8 } from "../../src/migration-base.ts";

/**
 * The stage an agent reports for its story (RFC 0232): `drafting` or `self`.
 * DB-owned and set only by `tasks stage`. trailmap's dashboard reads it to
 * tell a spawn that is reviewing its own diff from one still drafting.
 */
export class AddStageToStories extends Migration8 {
  async change() {
    await this.addColumn("stories", "stage", "string");
  }
}
