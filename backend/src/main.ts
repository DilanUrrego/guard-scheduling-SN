import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  // Validación automática de DTOs en todos los endpoints
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,  // Elimina campos no declarados en el DTO
      forbidNonWhitelisted: true,
      transform: true // Convierte tipos automáticamente
    }),
  );

  // CORS para el frontend angular
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:4200',
    credentials: true,
  });

  // Swager - documentación automática de la API
  const config = new DocumentBuilder()
    .setTitle('Clave Seguridad - Scheduling API')
    .setDescription('API del sistema de programación de turnos')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Backend corriendo en http://localhost:${port}`);
  console.log(`📚 Swagger docs en http://localhost:${port}/api/docs`);
}
bootstrap();
