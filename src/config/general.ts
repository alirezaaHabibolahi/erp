import * as process from 'node:process';

const positiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const generalConfig = () => ({
  mode: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  DATABASE_MONGO_URL: process.env.DATABASE_MONGO_URL || '',
  DATABASE_MONGO_USER: process.env.DATABASE_MONGO_USER || '',
  DATABASE_MONGO_PASS: process.env.DATABASE_MONGO_PASS || '',
  DATABASE_MONGO_NAME: process.env.DATABASE_MONGO_NAME || '',

  sessionStoreUrl: 'redis://' + process.env.REDIS_HOST + ':' + process.env.REDIS_PORT,
  redisUrl: process.env.REDIS_URL || "redis//127.0.0.1:6379",
  rateLimit: {
    default: {
      name: 'global',
      limit: positiveInteger(process.env.RATE_LIMIT_MAX, 100),
      ttl: positiveInteger(process.env.RATE_LIMIT_TTL_SECONDS, 60),
    },
  },
  sessionOptions: {
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET ?? 'QSmpgXkG2c',
    cookie: {
      maxAge: 5 * 60000,
      httpOnly: false,
    },
    key: 'user_sid',
  },
  worker_number: process.env.WORKER_NUMBER ? Number(process.env.WORKER_NUMBER) : 1,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_SECRET_EXPIRE_TIME: String(process.env.JWT_ACCESS_SECRET_EXPIRE_TIME) || "2d",
  JWT_REFRESH_SECRET_EXPIRE_TIME: String(process.env.JWT_REFRESH_SECRET_EXPIRE_TIME) || "7d",

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",

  SMS_PROVIDER: process.env.SMS_PROVIDER || "smsir",

  STUFFID_URL: process.env.STUFFID_URL || "https://stuffid.tax.gov.ir/portal-gateway",
  STUFFID_DOWNLOAD_FILE_URL: process.env.STUFFID_DOWNLOAD_FILE_URL || "/upload/gs/api/v1/fileupload/download/stream/",
  STUFFID_FILE_LIST_URL: process.env.STUFFID_FILE_LIST_URL || "/StuffRate/gs/graphql",

  EXCEL_CHUNK_SIZE: Number(process.env.EXCEL_CHUNK_SIZE || 10000),
  DB_BATCH_SIZE: Number(process.env.DB_BATCH_SIZE || 5000)
});
