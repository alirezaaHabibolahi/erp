import { Reflector } from '@nestjs/core';

export const Public = Reflector.createDecorator<void, boolean>({
  key: 'is_public_route',
  transform: () => true,
});
