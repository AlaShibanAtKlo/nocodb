import Noco from '~/Noco';
import { extractProps } from '~/helpers/extractProps';
import { MetaTable } from '~/utils/globals';
import { SyncSource } from '~/models';

export default class SyncLogs {
  id?: string;
  fk_workspace_id?: string;
  base_id?: string;
  fk_sync_source_id?: string;
  time_taken?: string;
  status?: string;
  status_details?: string;

  constructor(syncLog: Partial<SyncLogs>) {
    Object.assign(this, syncLog);
  }

  static async list(baseId: string, ncMeta = Noco.ncMeta) {
    const syncLogs = await ncMeta.metaList2(null, null, MetaTable.SYNC_LOGS, {
      condition: {
        base_id: baseId,
      },
      orderBy: {
        created_at: 'asc',
      },
    });
    return syncLogs?.map((h) => new SyncLogs(h));
  }

  public static async insert(syncLog: Partial<SyncLogs>, ncMeta = Noco.ncMeta) {
    const insertObj = extractProps(syncLog, [
      'base_id',
      'fk_sync_source_id',
      'time_taken',
      'status',
      'status_details',
    ]);

    const syncSource = await SyncSource.get(
      insertObj.fk_sync_source_id,
      ncMeta,
    );

    const { id } = await ncMeta.metaInsert2(
      syncSource.fk_workspace_id,
      syncSource.base_id,
      MetaTable.SYNC_LOGS,
      insertObj,
    );
    return new SyncLogs({ ...insertObj, id });
  }
}
