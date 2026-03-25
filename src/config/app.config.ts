import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME,
  env: process.env.APP_ENV,
  port: Number(process.env.PORT ?? 3000),
  url: process.env.APP_URL,
}));
