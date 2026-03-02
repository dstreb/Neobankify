import Redis from 'ioredis';

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
};

// Tenant-service Redis client — uses keyPrefix 'tenant:' for its own cache namespace.
const redis = new Redis({
  ...redisOptions,
  keyPrefix: 'tenant:',
});

// Raw Redis client — NO keyPrefix. Used to invalidate keys in other services'
// namespaces (e.g. the gateway's 'gw-tenant:' keys) without double-prefixing.
export const rawRedis = new Redis(redisOptions);

export default redis;
