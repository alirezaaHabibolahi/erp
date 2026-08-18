import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    UnprocessableEntityException
} from '@nestjs/common';
import {CreateUserDto} from './dto/create-user.dto';
import {UserRepository} from './user.repository';
import {GeneralHelper} from "@app/common/utils/general.helper";
import { CryptoHelper, IUser, MessageKey, MessageService } from '@app/common';
import {RegisterUserDto} from "./dto/register-user.dto";
import {SmsService} from "../sms/sms.service";
import {SmsPayload} from "../sms/interfaces/sms-provider.interface";
import { generalConfig } from '../config/general';
import { ObjectId } from 'mongodb';

@Injectable()
export class UsersService {

    constructor(
        private readonly userRepository: UserRepository,
        private readonly messageService: MessageService,
        private readonly smsService: SmsService
    ) {
    }

    async create(createUserDto: CreateUserDto) {
        const {email, phone} = createUserDto;

        if (email) {
            const existingByEmail = await this.userRepository.findByEmail(email);
            if (existingByEmail) {
                throw new ConflictException(this.messageService.get(MessageKey.USER_EMAIL_IS_USED));
            }
        }

        if (phone) {
            const existingByPhone = await this.userRepository.findByPhone(phone);
            if (existingByPhone) {
                throw new ConflictException(this.messageService.get(MessageKey.USER_PHONE_IS_USED));
            }
        }

        return this.userRepository.create(createUserDto);
    }

    async findAll() {
        return this.userRepository.findAll();
    }

    async findOne(id: string) {
        return await this.userRepository.findById(id);
    }

    async findByEmail(email: string) {
        return await this.userRepository.findByEmail(email);
    }

    async findByPhone(phone: string) {
        return await this.userRepository.findByPhone(phone);
    }


    async update(id: string, updateUserDto: Partial<IUser>) {
        const updated = await this.userRepository.updateById(id, updateUserDto);
        if (!updated) {
            throw new NotFoundException(this.messageService.get(MessageKey.USER_NOT_FOUND));
        }
        return updated;
    }

    async remove(id: string) {
        const deleted = await this.userRepository.deleteById(id);
        if (!deleted) {
            throw new NotFoundException(this.messageService.get(MessageKey.USER_NOT_FOUND));
        }
        return deleted;
    }

    async registerUserInfo(id: string, {username, password, confirmPassword, firstName, lastName}: RegisterUserDto) {
        const userDocument = await this.findOne(id)
        if (!userDocument) {
            throw new NotFoundException(this.messageService.get(MessageKey.USER_NOT_FOUND));
        }
        if(username !== userDocument.username){
            const findExistUser: IUser[] = await this.userRepository.findUsers({username: username})
            if (findExistUser.length) {
                throw new UnprocessableEntityException(this.messageService.get(MessageKey.USER_DUPLICATE_USERNAME))
            }
        }

        if (password.trim() !== confirmPassword.trim()) {
            throw new BadRequestException(this.messageService.get(MessageKey.USER_NOT_EQUAL_PASSWORD))
        }
        const hashPassword = await CryptoHelper.hash(password)
        const registerObj: Partial<IUser> = {
            username,
            password: hashPassword,
            first_name: firstName,
            last_name: lastName
        }

        // if(firstName) registerObj.first_name = firstName
        // if(lastName) registerObj.last_name = lastName
        return await this.userRepository.updateById(userDocument._id.toString(), registerObj)
    }

    async createUserOtpCodeAndSendSms(id: string): Promise<IUser | null> {
        const otpCode = GeneralHelper.generateOtp()
        const expireTime = GeneralHelper.generateOtpExpiration()
        const updatedUser = await this.userRepository.updateById(id, {otp_code: otpCode, expire_otp_code_date: expireTime})
        const payload: SmsPayload = {
            to: updatedUser!.phone,
            message: `کد تایید: ${updatedUser?.otp_code}`,
            templateId: 123456,
            params: [
                {
                    "name": "code",
                    "value": updatedUser?.otp_code
                },
            ]
        }
        this.smsService.send(payload, generalConfig().SMS_PROVIDER).then(res => console.log(`response is:${JSON.stringify(res)}`)).catch(err => console.log(`failed in sending sms: ${JSON.stringify(err)}`))
        return updatedUser
    }

    async getUserWithRolesAndAccesses(id:string){
      return await this.userRepository.getUserWithRolesAndAccesses(id)
    }
}
