import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './shared/http/all-exceptions.filter';

/**
 * Configuração HTTP compartilhada entre main.ts e os testes e2e, para que os
 * testes exercitem exatamente o mesmo pipeline de validação e erros.
 */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos não declarados no DTO
      forbidNonWhitelisted: true, // e rejeita a requisição se eles vierem
      transform: true, // converte query strings para os tipos do DTO
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Wallet Service')
    .setDescription('Carteira digital de jogadores com dinheiro simulado')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, swaggerConfig));
}
