# ChannelForge Write Authority

| Concept | Legacy writer | ChannelForge writer | Current authority | Cutover gate | Rollback |
| --- | --- | --- | --- | --- | --- |
| Inherited Tunarr installation identity | Settings DB | None | Legacy | Compatibility cutover | Existing Settings DB |
| ChannelForge Instance identity | None | `SqliteInstanceRepository` | ChannelForge for `cf_instance` only | Repository bootstrap integration | Preserve persisted Instance ID |
| Schema migration history | None | `ChannelForgeMigrationRunner` | ChannelForge | Runner integration | Leave additive metadata tables |
| Legacy Channels / Programs / media | Existing Tunarr runtime | None | Legacy | Later milestones | Existing Tunarr tables |

`cf_instance` does not replace inherited Tunarr settings in this unit.

The two identities coexist intentionally until the compatibility strategy
defines the mapping and read cutover.
