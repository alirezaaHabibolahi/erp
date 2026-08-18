import {BadRequestException, Injectable, ValidationPipe} from "@nestjs/common";
import {MessageService} from "@app/common";
import {ValidationError} from "joi";

@Injectable()
export class I18nValidationPipe extends ValidationPipe {
    constructor(private readonly messageService: MessageService) {
        super({
            whitelist: true,
            transform: true
        });
    }
}
