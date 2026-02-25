import { Global, Module } from '@nestjs/common';
import { validateEnv, AppConfig } from './env';

export const APP_CONFIG = Symbol('APP_CONFIG');

@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: (): AppConfig => validateEnv(),
    },
  ],
  exports: [APP_CONFIG],
})
export class ConfigModule {}
