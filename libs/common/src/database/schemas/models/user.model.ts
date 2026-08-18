import { Connection, Schema } from "mongoose";
import { ModelParent } from '@/models/Base/baseModelParent';
import { IUserDoc } from '@/types/user';
import { ObjectId } from 'mongodb';


export class UserSchema extends ModelParent<IUserDoc> {
  constructor(connection: Connection) {
    const schema = new Schema<Partial<IUserDoc>>(
      {
        phone: { type: String, required: true, unique: true },
        username: { type: String, unique: true },
        email: { type: String, unique: true, sparse: true },
        first_name: { type: String },
        last_name: { type: String },
        otp_code: { type: String },
        expire_otp_code_date: { type: Date },
        password: { type: String },
        is_verified: { type: Boolean, default: false },
        is_admin: { type: Boolean, default: false },
        role: { type: ObjectId, ref:"roles", required: true },
        is_active: { type: Boolean, default: true },
        settings: { type: Object, default: {} },
        deletedAt: { type: Date, default: null },
      },
      {
        timestamps: true
      },
    );

    super(connection, "user", "users", schema);
  }
}
