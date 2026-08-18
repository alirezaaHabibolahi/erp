import { Document } from "mongoose";
import mongoose from "mongoose";

export type ObjectId = mongoose.Types.ObjectId;
export type Decimal = mongoose.Types.Decimal128;
export type MDocument = Document<ObjectId>;
export interface IBaseSchema {
    _id: ObjectId;
    createdAt?: Date
    updatedAt?: Date
}

export interface IIdName {
    id: ObjectId;
    name: string;
}

export interface IIdValue {
    id: ObjectId;
    value: string;
}

export interface ITitleValue {
    title: string;
    value: string;
}

export interface ILocalValue extends IBaseSchema {
    locale: string;
    value: string;
}

export interface IProvinceCity {
    province: ObjectId;
    city: ObjectId;
}

export interface IImage {
    image: string;
    alt_image: string;
}

export interface IBill {
    tax: number;
    subtotal: number;
    total: number;
}

export interface IPriceRange {
    min: number;
    max: number;
}

export interface IVideo extends IBaseSchema {
    video_id: string;
    thumbnail: string;
    src: string;
    alt: string;
    hls: string;
}

export interface IIcon {
    font: string;
    value: string;
}

export interface IError {
    msg: string;
}
