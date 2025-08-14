import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: (config: Record<string, unknown>) => {
        const requiredEnvVars = [
          'DATABASE_URL',
          'REDIS_URL',
          'JWT_SECRET',
        ];

        const missingEnvVars = requiredEnvVars.filter(
          (envVar) => !config[envVar],
        );

        if (missingEnvVars.length > 0) {
          throw new Error(
            `Missing required environment variables: ${missingEnvVars.join(', ')}`,
          );
        }

        return config;
      },
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}