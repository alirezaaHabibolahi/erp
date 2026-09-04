import { Reflector } from '@nestjs/core';

export const ResponseMessage = Reflector.createDecorator<string>({
  key: 'response_message_key',
});
