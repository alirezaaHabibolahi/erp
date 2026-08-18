import { Reflector } from '@nestjs/core';


export const Access = Reflector.createDecorator<{
  role: string;
  access_list: string[];
}>();