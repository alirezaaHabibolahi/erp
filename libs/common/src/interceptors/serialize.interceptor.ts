import {
    UseInterceptors,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {plainToClass, plainToInstance} from 'class-transformer';

interface ClassConstructor {
    new (...args: any[]): {};
}

export function Serialize(dto: ClassConstructor) {
    return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
    constructor(private dto: any) {}

    intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
        return handler.handle().pipe(
            map((data: any) => {
              console.log(`data is: ${JSON.stringify(data,null,2)}`);
                let response: any = plainToInstance(this.dto, data?.data || data, {
                    excludeExtraneousValues: true,
                });
                if(data?.message)
                    response['message'] = data?.message
                return response
            }),
        );
    }
}
