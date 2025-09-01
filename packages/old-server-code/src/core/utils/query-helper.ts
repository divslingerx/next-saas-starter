import { sql, type SQL, eq } from 'drizzle-orm';

export class QueryHelper {
  static propertyEquals(table: any, field: string, value: any) {
    return sql`${table}.properties->>${field} = ${value}`;
  }
  
  static propertyContains(table: any, field: string, value: string) {
    return sql`${table}.properties->>${field} ILIKE ${`%${value}%`}`;
  }
  
  static withOrganizationScope(table: any, organizationId: string, conditions: SQL[] = []) {
    return [...conditions, eq(table.organizationId, organizationId)];
  }
  
  static buildPagination(query: any, page: number, limit: number) {
    const offset = (page - 1) * limit;
    return query.limit(limit).offset(offset);
  }
}