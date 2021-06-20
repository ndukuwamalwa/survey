import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { getManager } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { EncryptionService } from './services/encryption.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.enableCors();

  // Create a default user
  const password = EncryptionService.encryptPassword('Admin@2021');
  const user: UserEntity = {
    username: 'admin',
    password,
  };
  const exist = await getManager().getRepository(UserEntity).findOne({ username: 'admin' });
  if (!exist) {
    await getManager().getRepository(UserEntity).insert(user);
  }

  await app.listen(3000);
}
bootstrap();
