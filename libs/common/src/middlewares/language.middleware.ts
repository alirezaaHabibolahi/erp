import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '@app/common/context/request-context';
import { LanguageCode } from '@app/common';

@Injectable()
export class LanguageMiddleware implements NestMiddleware {
    use(req: Request  & { lang?: LanguageCode }, _res: Response, next: NextFunction) {
        // detect language
        const langHeader = req.headers['accept-language'] as string;
        const langQuery = (req.query.lang as string)?.toLowerCase();

        let lang: LanguageCode = 'en';
        if (langQuery === 'fa' || langHeader?.startsWith('fa')) {
            lang = 'fa';
        }
        req.lang = lang
        // Run within async context
        RequestContext.run(lang, next);
    }
}
