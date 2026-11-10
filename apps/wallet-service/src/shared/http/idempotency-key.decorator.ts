import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

const VALID_KEY = /^[A-Za-z0-9._:-]{1,100}$/;

/**
 * Lê e valida o header Idempotency-Key. O cliente gera a chave (ex.: um UUID)
 * e a reenvia em caso de retry; o servidor garante que o efeito acontece uma vez.
 */
export const IdempotencyKey = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const key = ctx.switchToHttp().getRequest<Request>().header('Idempotency-Key');
  if (!key) {
    throw new BadRequestException('O header Idempotency-Key é obrigatório');
  }
  if (!VALID_KEY.test(key)) {
    throw new BadRequestException(
      'Idempotency-Key deve ter até 100 caracteres: letras, números, ".", "_", ":" ou "-"',
    );
  }
  return key;
});
