import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  app.setGlobalPrefix('api');
  const frontend = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  const origins = [frontend];
  try {
    const url = new URL(frontend);
    if (!url.hostname.startsWith('www.')) {
      origins.push(`${url.protocol}//www.${url.hostname}`);
    }
  } catch {
    // keep the raw FRONTEND_URL only
  }

  app.enableCors({
    origin: origins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('TeacherConnect API')
      .setDescription('Parent communication and scheduling API')
      .setVersion('0.1.0')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      useGlobalPrefix: true,
    });
  }

  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port);
  console.log(`API ready at http://localhost:${port}/api`);
}

void bootstrap();
