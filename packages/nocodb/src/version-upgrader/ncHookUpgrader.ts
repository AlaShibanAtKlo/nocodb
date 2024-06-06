import type { NcUpgraderCtx } from './NcUpgrader';
import { MetaTable } from '~/utils/globals';

export default async function ({ ncMeta }: NcUpgraderCtx) {
  const actions = [];
  const hooks = await ncMeta.metaList2(context.workspace_id, context.base_id, MetaTable.HOOKS);
  for (const hook of hooks) {
    actions.push(
      ncMeta.metaUpdate(
        context.workspace_id,
        context.base_id,
        MetaTable.HOOKS,
        { version: 'v1' },
        hook.id,
      ),
    );
  }
  await Promise.all(actions);
}
