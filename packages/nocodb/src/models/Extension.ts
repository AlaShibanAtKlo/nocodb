import { prepareForDb, prepareForResponse } from '~/utils/modelUtils';
import Noco from '~/Noco';
import { extractProps } from '~/helpers/extractProps';
import {
  CacheDelDirection,
  CacheGetType,
  CacheScope,
  MetaTable,
} from '~/utils/globals';
import NocoCache from '~/cache/NocoCache';
import { Base } from '~/models';

export default class Extension {
  id?: string;
  fk_workspace_id?: string;
  base_id?: string;
  fk_user_id?: string;
  extension_id?: string;
  title?: string;
  kv_store?: any;
  meta?: any;
  order?: number;

  constructor(extension: Partial<Extension>) {
    Object.assign(this, extension);
  }

  public static async get(extensionId: string, ncMeta = Noco.ncMeta) {
    let extension = await NocoCache.get(
      `${CacheScope.EXTENSION}:${extensionId}`,
      CacheGetType.TYPE_OBJECT,
    );

    if (!extension) {
      extension = await ncMeta.metaGet2(
        null,
        null,
        MetaTable.EXTENSIONS,
        extensionId,
      );

      if (extension) {
        extension = prepareForResponse(extension, ['kv_store', 'meta']);
        NocoCache.set(`${CacheScope.EXTENSION}:${extensionId}`, extension);
      }
    }

    return extension && new Extension(extension);
  }

  static async list(baseId: string, ncMeta = Noco.ncMeta) {
    const cachedList = await NocoCache.getList(CacheScope.EXTENSION, [baseId]);
    let { list: extensionList } = cachedList;
    const { isNoneList } = cachedList;
    if (!isNoneList && !extensionList.length) {
      extensionList = await ncMeta.metaList2(null, null, MetaTable.EXTENSIONS, {
        condition: {
          base_id: baseId,
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      if (extensionList) {
        extensionList = extensionList.map((extension) =>
          prepareForResponse(extension, ['kv_store', 'meta']),
        );
        NocoCache.setList(CacheScope.EXTENSION, [baseId], extensionList);
      }
    }

    return extensionList
      ?.sort((a, b) => (a?.order ?? Infinity) - (b?.order ?? Infinity))
      .map((extension) => new Extension(extension));
  }

  public static async insert(
    extension: Partial<Extension>,
    ncMeta = Noco.ncMeta,
  ) {
    const insertObj = extractProps(extension, [
      'id',
      'base_id',
      'fk_user_id',
      'extension_id',
      'title',
      'kv_store',
      'meta',
      'order',
    ]);

    if (insertObj.order === null || insertObj.order === undefined) {
      insertObj.order = await ncMeta.metaGetNextOrder(MetaTable.EXTENSIONS, {
        base_id: insertObj.base_id,
      });
    }

    const base = await Base.get(insertObj.base_id, ncMeta);

    const { id } = await ncMeta.metaInsert2(
      base.fk_workspace_id,
      base.id,
      MetaTable.EXTENSIONS,
      prepareForDb(insertObj, ['kv_store', 'meta']),
    );

    return this.get(id, ncMeta).then(async (res) => {
      await NocoCache.appendToList(
        CacheScope.EXTENSION,
        [extension.base_id],
        `${CacheScope.EXTENSION}:${id}`,
      );
      return res;
    });
  }

  public static async update(
    extensionId: string,
    extension: Partial<Extension>,
    ncMeta = Noco.ncMeta,
  ) {
    const existingExt = await this.get(extensionId, ncMeta);

    const updateObj = extractProps(extension, [
      'fk_user_id',
      'extension_id',
      'title',
      'kv_store',
      'meta',
      'order',
    ]);

    // set meta
    await ncMeta.metaUpdate(
      existingExt.fk_workspace_id,
      existingExt.base_id,
      MetaTable.EXTENSIONS,
      prepareForDb(updateObj, ['kv_store', 'meta']),
      extensionId,
    );

    await NocoCache.update(
      `${CacheScope.EXTENSION}:${extensionId}`,
      prepareForResponse(updateObj, ['kv_store', 'meta']),
    );

    return this.get(extensionId, ncMeta);
  }

  static async delete(extensionId: any, ncMeta = Noco.ncMeta) {
    const extension = await this.get(extensionId, ncMeta);

    const res = await ncMeta.metaDelete(
      extension.fk_workspace_id,
      extension.base_id,
      MetaTable.EXTENSIONS,
      extensionId,
    );

    await NocoCache.deepDel(
      `${CacheScope.EXTENSION}:${extensionId}`,
      CacheDelDirection.CHILD_TO_PARENT,
    );

    return res;
  }
}
