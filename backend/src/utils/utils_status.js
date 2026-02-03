// 将外部传入的状态值规整为可用的数字，避免空串或非法输入污染查询
export const normalizeStatusFilter = (rawStatus) => {
  if (rawStatus === undefined || rawStatus === null) {
    return undefined;
  }

  if (typeof rawStatus === 'number') {
    return Number.isNaN(rawStatus) ? undefined : rawStatus;
  }

  if (typeof rawStatus === 'string') {
    const trimmed = rawStatus.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
};