import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { deploymentConfig } from './deployment-config';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = deploymentConfig();
  // Vercel terminates TLS before forwarding to the NestJS function.
  if (config.production) app.getHttpAdapter().getInstance().set('trust proxy', 1);
  const PgSession = connectPgSimple(session);

  app.use(
    session({
      secret: config.sessionSecret,
      store: config.production ? new PgSession({
        conObject: {
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT || 5432),
          user: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_DATABASE,
          ssl: { rejectUnauthorized: true, ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') } : {}) },
          max: 2,
          idleTimeoutMillis: 10000,
          connectionTimeoutMillis: 10000,
        },
        tableName: 'oauth_sessions',
        createTableIfMissing: false,
        pruneSessionInterval: false,
      }) : undefined,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.production,
        maxAge: 10 * 60 * 1000,
      },
    }),
  );

  // Allow larger payloads for base64 profile image updates.
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  app.enableCors({ origin: config.frontendUrl, credentials: true });

  const port = parseInt(process.env.PORT ?? '3001', 10);
  await app.listen(port);
  console.log(`Nest application listening on port ${port}`);
}
bootstrap();
