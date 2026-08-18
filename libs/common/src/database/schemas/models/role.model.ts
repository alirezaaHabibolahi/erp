import { Schema, Connection } from 'mongoose';
import { IRoleDoc } from '@/types/role';
import { ModelParent } from '@/models/Base/baseModelParent';

export class RoleSchema extends ModelParent<IRoleDoc> {
  constructor(connection: Connection) {

    const schema =  new Schema<IRoleDoc>(
      {
        fa_name: {
          type: String,
          required: true,
          trim: true,
        },

        en_name: {
          type: String,
          required: true,
          unique: true,
          trim: true,
          lowercase: true,
        },

        accesses: [
          {
            type: Schema.Types.ObjectId,
            ref: 'access',
          },
        ],
      },
      {
        timestamps: true,
      },
    )


    super(connection, "role", "roles", schema);
  }
}
