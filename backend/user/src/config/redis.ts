import redis from "redis";
import type { RedisClientType } from "redis";

export const redisClient: RedisClientType = redis.createClient({
  url: `${process.env["REDIS_URL"]}`,
});

const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    if (redisClient.isOpen) {
      console.log("Redis connected");
    } else {
      throw new Error("Redis Socket Not open");
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
export default connectRedis;
