# ChannelForge Write Authority

| Concept | Legacy writer | ChannelForge writer | Current authority | Cutover gate | Rollback |
| --- | --- | --- | --- | --- | --- |
| Inherited Tunarr installation identity | Settings DB | None | Legacy | Compatibility cutover | Existing Settings DB |
| ChannelForge Instance identity | None | `SqliteInstanceRepository` | ChannelForge for `cf_instance` only | Repository bootstrap integration | Preserve persisted Instance ID |
| Instance compatibility read proof | Settings DB | None | Legacy runtime; verified mapped proof available | Explicit production wiring and shadow acceptance | Use inherited identity reader |
| Schema migration history | None | `ChannelForgeMigrationRunner` | ChannelForge | Runner integration | Leave additive metadata tables |
| Legacy Channels / Programs / media | Existing Tunarr runtime | None | Legacy | Later milestones | Existing Tunarr tables |

`MappedTunarrInstanceIdentityReader` demonstrates a mapping-qualified
ChannelForge identity read with observable shadow findings and deterministic
legacy fallback.

The proof is not wired into the inherited runtime startup path.

No legacy write authority changes in Milestone 03.
