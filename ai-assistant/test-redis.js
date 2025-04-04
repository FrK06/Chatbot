// test-redis.js (update to use no password)
const Redis = require("ioredis");
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  // No password initially
});

redis.ping()
  .then(result => {
    console.log("Redis connection successful:", result);
    process.exit(0);
  })
  .catch(err => {
    console.error("Redis connection failed:", err);
    process.exit(1);
  });