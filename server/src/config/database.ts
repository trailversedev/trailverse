import { PrismaClient, Prisma } from ‘@prisma/client’;
import { performance } from ‘perf_hooks’;

// Global Prisma instance for connection reuse
declare global {
  var __prisma: PrismaClient | undefined;
}

// Prisma client configuration
const prismaConfig: Prisma.PrismaClientOptions = {
  log: process.env.NODE_ENV === ‘development’
? [‘query’, ‘info’, ‘warn’, ‘error’]
: [‘error’],
errorFormat: ‘pretty’,
datasources: {
  db: {
    url: process.env.DATABASE_URL,
  },
},
};

// Create Prisma client with proper configuration
function createPrismaClient(): PrismaClient {
  const client = new PrismaClient(prismaConfig);

// Add query performance monitoring
  if (process.env.NODE_ENV === ‘development’) {
    client.$use(async (params, next) => {
      const start = performance.now();
      const result = await next(params);
      const end = performance.now();
      const duration = end - start;

      ```
  // Log slow queries (>1000ms)
  if (duration > 1000) {
    console.warn(`🐌 Slow Query (${duration.toFixed(2)}ms):`, {
      model: params.model,
      action: params.action,
      duration: `${duration.toFixed(2)}ms`,
    });
  }

  return result;
});
```

    }

// Add error handling middleware
    client.$use(async (params, next) => {
      try {
        return await next(params);
      } catch (error) {
        console.error(‘Database operation failed:’, {
          model: params.model,
            action: params.action,
            error: error instanceof Error ? error.message : ‘Unknown error’,
        });
        throw error;
      }
    });

    return client;
  }

// Singleton pattern for Prisma client
  export const prisma = globalThis.__prisma || createPrismaClient();

  if (process.env.NODE_ENV === ‘development’) {
    globalThis.__prisma = prisma;
  }

// Database connection management
  export class DatabaseManager {
    private static instance: DatabaseManager;
    private isConnected = false;
    private connectionPromise: Promise<void> | null = null;

    private constructor() {}

    static getInstance(): DatabaseManager {
      if (!DatabaseManager.instance) {
        DatabaseManager.instance = new DatabaseManager();
      }
      return DatabaseManager.instance;
    }

    /**

     - Connect to the database
     */
    async connect(): Promise<void> {
      if (this.isConnected) {
        return;
      }

      ```
if (this.connectionPromise) {
  return this.connectionPromise;
}

this.connectionPromise = this.performConnection();
return this.connectionPromise;
```

    }

    private async performConnection(): Promise<void> {
      try {
        console.log(‘🔌 Connecting to database…’);

        ```
  // Test the connection
  await prisma.$connect();

  // Verify with a simple query
  await prisma.$queryRaw`SELECT 1`;

  this.isConnected = true;
  console.log('✅ Database connected successfully');
} catch (error) {
  console.error('❌ Database connection failed:', error);
  this.connectionPromise = null;
  throw error;
}
```

      }

      /**

       - Disconnect from the database
       */
      async disconnect(): Promise<void> {
        if (!this.isConnected) {
        return;
      }

      ```
try {
  console.log('🔌 Disconnecting from database...');
  await prisma.$disconnect();
  this.isConnected = false;
  this.connectionPromise = null;
  console.log('✅ Database disconnected successfully');
} catch (error) {
  console.error('❌ Database disconnection failed:', error);
  throw error;
}
```

    }

      /**

       - Check database health
       */
      async healthCheck(): Promise<{
        status: ‘healthy’ | ‘unhealthy’;
      responseTime: number;
      error?: string;
    }> {
        try {
          const start = performance.now();
          await prisma.$queryRaw`SELECT 1`;
          const end = performance.now();
          const responseTime = end - start;

          return {
            status: ‘healthy’,
          responseTime: Math.round(responseTime),
        };
        } catch (error) {
          return {
            status: ‘unhealthy’,
          responseTime: 0,
            error: error instanceof Error ? error.message : ‘Unknown error’,
        };
        }
      }

      /**

       - Get connection status
       */
      isHealthy(): boolean {
        return this.isConnected;
      }
    }

// Database query helpers
    export class DatabaseHelpers {
    /**

     - Execute a transaction with retry logic
     */
    static async executeTransaction<T>(
      operation: (prisma: Prisma.TransactionClient) => Promise<T>,
      maxRetries = 3
    ): Promise<T> {
      let lastError: Error | null = null;

      ```
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    return await prisma.$transaction(operation, {
      maxWait: 5000, // 5 seconds
      timeout: 10000, // 10 seconds
    });
  } catch (error) {
    lastError = error as Error;

    // Don't retry on validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      throw error;
    }

    // Don't retry on known errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw error;
    }

    console.warn(`Transaction attempt ${attempt} failed:`, error);

    if (attempt === maxRetries) {
      break;
    }

    // Wait before retry with exponential backoff
    await this.delay(Math.pow(2, attempt) * 100);
  }
}

throw lastError || new Error('Transaction failed after all retries');
```

    }

    /**

     - Paginate query results
     */
    static async paginate<T>(
      query: (args: { skip: number; take: number }) => Promise<T[]>,
      countQuery: () => Promise<number>,
      page: number = 1,
      limit: number = 20
    ): Promise<{
      data: T[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    }> {
      const validPage = Math.max(1, page);
      const validLimit = Math.min(100, Math.max(1, limit));
      const skip = (validPage - 1) * validLimit;

      ```
const [data, total] = await Promise.all([
  query({ skip, take: validLimit }),
  countQuery(),
]);

const totalPages = Math.ceil(total / validLimit);

return {
  data,
  total,
  page: validPage,
  limit: validLimit,
  totalPages,
  hasNext: validPage < totalPages,
  hasPrev: validPage > 1,
};
```

    }

    /**

     - Search with full-text search
     */
    static createFullTextSearch(searchTerm: string, fields: string[]): Prisma.Sql {
      const searchWords = searchTerm
        .split(’ ’)
    .filter(word => word.length > 0)
        .map(word => `%${word}%`);

      ```
if (searchWords.length === 0) {
  return Prisma.sql`1=1`;
}

const conditions = fields.map(field => {
  const fieldConditions = searchWords.map(word =>
    Prisma.sql`${Prisma.raw(field)} ILIKE ${word}`
  );
  return Prisma.sql`(${Prisma.join(fieldConditions, ' OR ')})`;
});

return Prisma.sql`(${Prisma.join(conditions, ' OR ')})`;
```

    }

    /**

     - Build dynamic where clause
     */
    static buildWhereClause<T>(filters: Record<string, any>): T {
      const where: Record<string, any> = {};

      ```
Object.entries(filters).forEach(([key, value]) => {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value) && value.length > 0) {
    where[key] = { in: value };
  } else if (typeof value === 'string' && value.trim() !== '') {
    where[key] = { contains: value, mode: 'insensitive' };
  } else if (typeof value === 'boolean' || typeof value === 'number') {
    where[key] = value;
  } else if (typeof value === 'object' && value.from && value.to) {
    where[key] = { gte: value.from, lte: value.to };
  }
});

return where as T;
```

    }

    /**

     - Batch operations with proper error handling
     */
    static async batchCreate<T>(
      model: any,
      data: any[],
      batchSize: number = 100
    ): Promise<T[]> {
      const results: T[] = [];

      ```
for (let i = 0; i < data.length; i += batchSize) {
  const batch = data.slice(i, i + batchSize);

  try {
    const batchResults = await prisma.$transaction(
      batch.map(item => model.create({ data: item }))
    );
    results.push(...batchResults);
  } catch (error) {
    console.error(`Batch create failed for items ${i}-${i + batch.length}:`, error);
    throw error;
  }
}

return results;
```

    }

    /**

     - Upsert with conflict resolution
     */
    static async upsertMany<T>(
      model: any,
      data: any[],
      uniqueField: string
    ): Promise<T[]> {
      const results: T[] = [];

      ```
for (const item of data) {
  try {
    const result = await model.upsert({
      where: { [uniqueField]: item[uniqueField] },
      update: item,
      create: item,
    });
    results.push(result);
  } catch (error) {
    console.error(`Upsert failed for ${uniqueField}: ${item[uniqueField]}`, error);
    throw error;
  }
}

return results;
```

    }

    /**

     - Soft delete implementation
     */
    static async softDelete(
      model: any,
      where: any,
      deletedAtField: string = ‘deletedAt’
  ): Promise<any> {
      return model.updateMany({
        where,
        data: { [deletedAtField]: new Date() },
      });
    }

    /**

     - Restore soft deleted records
     */
    static async restore(
      model: any,
      where: any,
      deletedAtField: string = ‘deletedAt’
  ): Promise<any> {
      return model.updateMany({
        where,
        data: { [deletedAtField]: null },
      });
    }

    /**

     - Get database statistics
     */
    static async getDatabaseStats(): Promise<{
      tables: Array<{
        name: string;
        rowCount: number;
        sizeEstimate: string;
      }>;
      totalSize: string;
      connectionCount: number;
    }> {
      try {
        // Get table statistics
        const tableStats = await prisma.$queryRaw<Array<{
          table_name: string;
          row_count: bigint;
          size_estimate: string;
        }>>`SELECT  schemaname, tablename as table_name, n_tup_ins - n_tup_del as row_count, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_estimate FROM pg_stat_user_tables  WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;`;

        // Get total database size
        const [dbSize] = await prisma.$queryRaw<Array<{ size: string }>>`SELECT pg_size_pretty(pg_database_size(current_database())) as size;`;

        // Get connection count
        const [connectionInfo] = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active';`;

        return {
          tables: tableStats.map(stat => ({
            name: stat.table_name,
            rowCount: Number(stat.row_count),
            sizeEstimate: stat.size_estimate,
          })),
          totalSize: dbSize.size,
          connectionCount: Number(connectionInfo.count),
        };
      } catch (error) {
        console.error(‘Failed to get database stats:’, error);
        throw error;
      }
    }

    /**

     - Utility delay function
     */
    private static delay(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }

// Performance monitoring
  export class DatabasePerformanceMonitor {
    private static queryCount = 0;
    private static totalQueryTime = 0;
    private static slowQueries: Array<{
      query: string;
      duration: number;
      timestamp: Date;
    }> = [];

    /**

     - Track query performance
     */
    static trackQuery(query: string, duration: number): void {
      this.queryCount++;
      this.totalQueryTime += duration;

      ```
// Track slow queries (>500ms)
if (duration > 500) {
  this.slowQueries.push({
    query,
    duration,
    timestamp: new Date(),
  });

  // Keep only last 100 slow queries
  if (this.slowQueries.length > 100) {
    this.slowQueries = this.slowQueries.slice(-100);
  }
}
```

    }

    /**

     - Get performance statistics
     */
    static getStats(): {
      totalQueries: number;
      averageQueryTime: number;
      slowQueries: number;
      recentSlowQueries: Array<{
        query: string;
        duration: number;
        timestamp: Date;
      }>;
    } {
      return {
        totalQueries: this.queryCount,
        averageQueryTime: this.queryCount > 0 ? this.totalQueryTime / this.queryCount : 0,
        slowQueries: this.slowQueries.length,
        recentSlowQueries: this.slowQueries.slice(-10),
      };
    }

    /**

     - Reset statistics
     */
    static reset(): void {
      this.queryCount = 0;
      this.totalQueryTime = 0;
      this.slowQueries = [];
    }
  }

// Common query patterns
  export class CommonQueries {
    /**

     - Find by ID with existence check
     */
    static async findByIdOrThrow<T>(
      model: any,
      id: string,
      include?: any
    ): Promise<T> {
      const result = await model.findUnique({
        where: { id },
        include,
      });

      ```
if (!result) {
  throw new Error(`Record with ID ${id} not found`);
}

return result;
```

    }

    /**

     - Find unique or create
     */
    static async findOrCreate<T>(
      model: any,
      where: any,
      create: any
    ): Promise<{ data: T; created: boolean }> {
      let data = await model.findUnique({ where });
      let created = false;

      ```
if (!data) {
  data = await model.create({ data: create });
  created = true;
}

return { data, created };
```

    }

    /**

     - Increment counter fields safely
     */
    static async incrementCounter(
      model: any,
      where: any,
      field: string,
      increment: number = 1
    ): Promise<any> {
      return model.update({
        where,
        data: {
          [field]: {
            increment,
          },
        },
      });
    }

    /**

     - Get recent records
     */
    static async getRecent<T>(
      model: any,
      limit: number = 10,
      include?: any
    ): Promise<T[]> {
      return model.findMany({
        take: limit,
        orderBy: { createdAt: ‘desc’ },
      include,
    });
    }

    /**

     - Search across multiple fields
     */
    static async multiFieldSearch<T>(
      model: any,
      searchTerm: string,
      fields: string[],
      limit: number = 20
    ): Promise<T[]> {
      const searchConditions = fields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: ‘insensitive’ as const,
    },
    }));

      ```
return model.findMany({
  where: {
    OR: searchConditions,
  },
  take: limit,
  orderBy: { createdAt: 'desc' },
});
```

    }
  }

// Export the database manager instance
  export const dbManager = DatabaseManager.getInstance();

// Database middleware for Express
  export const databaseMiddleware = async (req: any, res: any, next: any) => {
    try {
      await dbManager.connect();
      next();
    } catch (error) {
      console.error(‘Database middleware error:’, error);
      res.status(503).json({
        success: false,
        error: ‘Database unavailable’,
      code: ‘DATABASE_ERROR’,
    });
    }
  };

// Graceful shutdown handler
  export const gracefulShutdown = async (): Promise<void> => {
    console.log(‘🔌 Shutting down database connections…’);

    try {
      await dbManager.disconnect();
      console.log(‘✅ Database connections closed successfully’);
    } catch (error) {
      console.error(‘❌ Error closing database connections:’, error);
    }
  };

// Export all utilities
  export default {
    prisma,
    dbManager,
    DatabaseManager,
    DatabaseHelpers,
    DatabasePerformanceMonitor,
    CommonQueries,
    databaseMiddleware,
    gracefulShutdown,
  };
