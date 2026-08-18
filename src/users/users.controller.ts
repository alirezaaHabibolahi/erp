import {Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards, HttpStatus, HttpCode} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {JwtAuthGuard} from "../guards/jwt-ath.guard";
import { CurrentUser, IUser, MessageKey, Serialize, TokenPayload } from '@app/common';
import {Roles} from "../decorators/roles.decorator";
import {RoleAuthGuard} from "../guards/roles.guard";
import {ResponseMessage} from "../decorators/response-message.decorator";
import {RegisterUserDto} from "./dto/register-user.dto";
import {RegisterUserResponseDto} from "./dto/register-user-response.dto";
import {UpdateUserResponseDto} from "./dto/update-user-response.dto";

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles("admin")
  @ApiBearerAuth('bearer')
  findAll() {
    return this.usersService.findAll();
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.usersService.findOne(id);
  // }

  @Put()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RoleAuthGuard)
  @Roles('user','admin')
  @Serialize(UpdateUserResponseDto)
  @ApiBearerAuth('bearer')
  update(@CurrentUser() user: TokenPayload, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(user._id, updateUserDto);
  }

  @Put("register")
  @UseGuards(JwtAuthGuard)
  @Serialize(RegisterUserResponseDto)
  @ApiBearerAuth('bearer')
  register(@CurrentUser() user: TokenPayload, @Body() registerUserDto: RegisterUserDto){
    return this.usersService.registerUserInfo(user._id, registerUserDto)
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.usersService.remove(id);
  // }
}
