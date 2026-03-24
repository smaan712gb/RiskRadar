import type { PaginationMeta } from '@riskradar/shared';

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export function buildPaginationMeta(total: number, options: PaginationOptions): PaginationMeta {
  const totalPages = Math.ceil(total / options.pageSize);
  return {
    total,
    page: options.page,
    pageSize: options.pageSize,
    totalPages,
    hasNext: options.page < totalPages,
    hasPrev: options.page > 1,
  };
}

export function buildPrismaSkipTake(options: PaginationOptions) {
  return {
    skip: (options.page - 1) * options.pageSize,
    take: options.pageSize,
  };
}
