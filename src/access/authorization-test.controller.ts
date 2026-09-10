import { Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@app/common/decorators';
import { MessageKey } from '@app/common/constants';
import type { TokenPayload } from '@app/common/dto';
import { RequireAccess } from '../decorators/access.decorator';
import { ActionCode, ResourceCode, SystemCode } from './access-codes';

@ApiTags('Authorization Test')
@ApiBearerAuth('bearer')
@Controller('authorization-test')
export class AuthorizationTestController {
  @Get('sales/proforma/read')
  @RequireAccess({
    systemCode: SystemCode.SALES,
    resourceCode: ResourceCode.SALES_PROFORMA,
    actionCode: ActionCode.READ,
  })
  @ApiOperation({ summary: 'Protected test route for proforma read access' })
  readSalesProforma(@CurrentUser() user: TokenPayload) {
    return {
      data: {
        ok: true,
        userId: user.sub,
        permission: `${SystemCode.SALES}.${ResourceCode.SALES_PROFORMA}.${ActionCode.READ}`,
      },
      messageKey: MessageKey.GENERAL_SUCCESS,
    };
  }

  @Post('sales/proforma/create')
  @HttpCode(200)
  @RequireAccess({
    systemCode: SystemCode.SALES,
    resourceCode: ResourceCode.SALES_PROFORMA,
    actionCode: ActionCode.CREATE,
  })
  @ApiOperation({ summary: 'Protected test route for proforma create access' })
  createSalesProforma(@CurrentUser() user: TokenPayload) {
    return {
      data: {
        ok: true,
        userId: user.sub,
        permission: `${SystemCode.SALES}.${ResourceCode.SALES_PROFORMA}.${ActionCode.CREATE}`,
      },
      messageKey: MessageKey.GENERAL_SUCCESS,
    };
  }

  @Patch('sales/proforma/update-own')
  @RequireAccess({
    systemCode: SystemCode.SALES,
    resourceCode: ResourceCode.SALES_PROFORMA,
    actionCode: ActionCode.UPDATE,
  })
  @ApiOperation({
    summary: 'Protected test route for own proforma update access',
  })
  updateOwnSalesProforma(@CurrentUser() user: TokenPayload) {
    return {
      data: {
        ok: true,
        userId: user.sub,
        permission: `${SystemCode.SALES}.${ResourceCode.SALES_PROFORMA}.${ActionCode.UPDATE}`,
      },
      messageKey: MessageKey.GENERAL_SUCCESS,
    };
  }

  @Get('sales/invoice/read')
  @RequireAccess({
    systemCode: SystemCode.SALES,
    resourceCode: ResourceCode.SALES_INVOICE,
    actionCode: ActionCode.READ,
  })
  @ApiOperation({ summary: 'Protected test route for invoice read access' })
  readSalesInvoice(@CurrentUser() user: TokenPayload) {
    return {
      data: {
        ok: true,
        userId: user.sub,
        permission: `${SystemCode.SALES}.${ResourceCode.SALES_INVOICE}.${ActionCode.READ}`,
      },
      messageKey: MessageKey.GENERAL_SUCCESS,
    };
  }
}
