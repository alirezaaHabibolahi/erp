import { Schema, Connection } from 'mongoose';
import { ModelParent } from '@/models/Base/baseModelParent';
import { IAccess, IAccessDoc } from '@/types/access';

export class AccessSchema extends ModelParent<IAccessDoc> {
  constructor(connection: Connection) {

    const schema = new Schema<Partial<IAccess>>(
      {
        fa_name: { type: String, required: true, trim: true },
        en_name: { type: String, required: true, unique: true, trim: true },
      },
      { timestamps: true },
    );


    super(connection, 'access', 'accesses', schema);
  }
}
