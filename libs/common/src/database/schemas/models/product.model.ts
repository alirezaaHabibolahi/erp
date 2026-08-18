import { Connection, Schema } from 'mongoose';
import { ModelParent } from '@/models/Base/baseModelParent';
import { IProductDoc } from '@/types/product';

export class ProductSchema extends ModelParent<IProductDoc> {
  constructor(connection: Connection) {
    const schema = new Schema<Partial<IProductDoc>>(
      {
        ID: {
          type: String,
          required: true,
        },
        DescriptionOfID: {
          type: String,
          required: true
        },
        VAT: {
          type: Number,
          default:0
        },
        Taxable: {
          type: String,
          required: false,
          default: 'نامشخص'
        },
        RunDate: {
          type: Date,
        },
        ExpirationDate: {
          type: Date,
          default: null
        },
        Type: {
          type: String,
        },
        CreateDate: {
          type: Date,
          required: true
        },
        LastEditDate: {
          type: Date,
          required: true
        },
        importBatch: {
          type: String,
          required: true
        },
        importDate: {
          type: Date,
          default: Date.now
        },
        sourceFile: {
          type: String,
          required: true
        },
        deletedAt: {
          type: Date,
          default: null
        },
        isActive: {
          type: Boolean,
          default:true
        },
        activatedAt:{
          type: Date,
          default: Date.now
        },
        deactivatedAt:{
          type: Date,
          default: null
        }
      },
      {
        timestamps: true,
        strict: false,
      },
    );

    schema.index({ ID: 1});
    // schema.index({ DescriptionOfID: 1});
    schema.index({ RunDate: 1 });
    schema.index({ ExpirationDate: 1 });
    schema.index({ Type: 1 });
    schema.index({ importBatch: 1 });

    super(connection, 'product', 'products', schema);
  }
}