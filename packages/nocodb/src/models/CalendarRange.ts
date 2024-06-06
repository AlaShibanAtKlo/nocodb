import type { CalendarRangeType } from 'nocodb-sdk';
import Noco from '~/Noco';
import NocoCache from '~/cache/NocoCache';
import { extractProps } from '~/helpers/extractProps';
import { CacheDelDirection, CacheScope, MetaTable } from '~/utils/globals';
import { Column } from '~/models';
import { NcError } from '~/helpers/catchError';

export default class CalendarRange implements CalendarRangeType {
  id?: string;
  fk_from_column_id?: string;
  fk_workspace_id?: string;
  base_id?: string;
  fk_view_id?: string;

  constructor(data: Partial<CalendarRange>) {
    Object.assign(this, data);
  }

  public static async bulkInsert(
    data: Partial<CalendarRange>[],
    ncMeta = Noco.ncMeta,
  ) {
    const calRanges: {
      fk_from_column_id?: string;
      fk_view_id?: string;
    }[] = [];

    for (const d of data) {
      const tempObj = extractProps(d, ['fk_from_column_id', 'fk_view_id']);
      calRanges.push(tempObj);
    }

    if (!calRanges.length) return false;

    const insertObj = calRanges[0];

    const column = await Column.get({
      colId: insertObj.fk_from_column_id,
    });

    if (!column) {
      NcError.fieldNotFound(insertObj.fk_from_column_id);
    }

    const insertData = await ncMeta.metaInsert2(
      column.fk_workspace_id,
      column.base_id,
      MetaTable.CALENDAR_VIEW_RANGE,
      insertObj,
    );

    await NocoCache.deepDel(
      `${CacheScope.CALENDAR_VIEW_RANGE}:${insertData.fk_view_id}:list`,
      CacheDelDirection.PARENT_TO_CHILD,
    );

    await NocoCache.set(
      `${CacheScope.CALENDAR_VIEW_RANGE}:${insertData.id}`,
      insertData,
    );

    await NocoCache.appendToList(
      CacheScope.CALENDAR_VIEW_RANGE,
      [insertData.fk_view_id],
      `${CacheScope.CALENDAR_VIEW_RANGE}:${insertData.id}`,
    );

    return true;
  }

  public static async read(fk_view_id: string, ncMeta = Noco.ncMeta) {
    const cachedList = await NocoCache.getList(CacheScope.CALENDAR_VIEW_RANGE, [
      fk_view_id,
    ]);
    let { list: ranges } = cachedList;
    const { isNoneList } = cachedList;
    if (!isNoneList && !ranges.length) {
      ranges = await ncMeta.metaList2(
        null, //,
        null, //model.db_alias,
        MetaTable.CALENDAR_VIEW_RANGE,
        { condition: { fk_view_id } },
      );
      await NocoCache.setList(
        CacheScope.CALENDAR_VIEW_RANGE,
        [fk_view_id],
        ranges.map(({ created_at, updated_at, ...others }) => others),
      );
    }

    return ranges?.length
      ? {
          ranges: ranges.map(
            ({ created_at, updated_at, ...c }) => new CalendarRange(c),
          ),
        }
      : null;
  }

  public static async find(
    fk_view_id: string,
    ncMeta = Noco.ncMeta,
  ): Promise<CalendarRange> {
    const data = await ncMeta.metaGet2(
      null,
      null,
      MetaTable.CALENDAR_VIEW_RANGE,
      {
        fk_view_id,
      },
    );

    return data && new CalendarRange(data);
  }

  public static async IsColumnBeingUsedAsRange(
    columnId: string,
    ncMeta = Noco.ncMeta,
  ) {
    return (
      (
        await ncMeta.metaList2(null, null, MetaTable.CALENDAR_VIEW_RANGE, {
          xcCondition: {
            _or: [
              {
                fk_from_column_id: {
                  eq: columnId,
                },
              },
            ],
          },
        })
      ).length > 0
    );
  }
}
