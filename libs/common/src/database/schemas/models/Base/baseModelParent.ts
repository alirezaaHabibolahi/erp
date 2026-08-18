import { Connection, Model, Schema } from "mongoose";

export class ModelParent<IModel> {
    private static modelCache = new Map<string, Model<any>>();

    private _model!: Model<IModel>;

    constructor(
        connection: Connection,
        modelName: string,
        collectionName: string,
        schema: Schema
    ) {
        if (!ModelParent.modelCache.has(modelName)) {
            ModelParent.modelCache.set(
                modelName,
                connection.model(modelName, schema, collectionName)
            );
        }

        this.model = ModelParent.modelCache.get(modelName)!;
    }

    private set model(connectionModel: Model<IModel>) {
        this._model = connectionModel;
    }

    public get model() {
        return this._model;
    }
}
