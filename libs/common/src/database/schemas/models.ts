import { Connection } from 'mongoose';
import { UserSchema } from '@/models/user.model';
import { AccessSchema } from '@/models/access.model';
import { RoleSchema } from '@/models/role.model';
import { ProductSchema } from '@/models/product.model';
import { ImportLogSchema } from '@/models/import-log.model';
import { TokenSessionSchema } from '@/models/token-session.model';


export class Models {

  private readonly _user: UserSchema;
  private readonly _access: AccessSchema
  private readonly _role: RoleSchema;
  private readonly _product: ProductSchema;
  private readonly _importLog: ImportLogSchema;
  private readonly _tokenSession: TokenSessionSchema;

  constructor(connection: Connection) {
    this._user = new UserSchema(connection);
    this._access = new AccessSchema(connection);
    this._role = new RoleSchema(connection);
    this._product = new ProductSchema(connection)
    this._importLog = new ImportLogSchema(connection)
    this._tokenSession = new TokenSessionSchema(connection)
  }

  get user() {
    return this._user;
  }
  get access(){
    return this._access;
  }
  get role(){
    return this._role;
  }
  get product(){
    return this._product;
  }
  get importLog(){
    return this._importLog;
  }
  get tokenSession() {
    return this._tokenSession;
  }
}
