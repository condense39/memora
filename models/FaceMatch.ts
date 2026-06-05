import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBoundingBox {
  Width: number;
  Height: number;
  Left: number;
  Top: number;
}

export interface IFaceMatch extends Document {
  _id: mongoose.Types.ObjectId;
  mediaId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rekognitionFaceId?: string;
  confidence: number;
  boundingBox: IBoundingBox;
  createdAt: Date;
}

const FaceMatchSchema = new Schema<IFaceMatch>(
  {
    mediaId: {
      type: Schema.Types.ObjectId,
      ref: "Media",
      required: [true, "Media ID is required"],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    rekognitionFaceId: {
      type: String,
      default: null,
    },
    confidence: {
      type: Number,
      required: [true, "Confidence score is required"],
      min: 0,
      max: 100,
    },
    boundingBox: {
      Width: { type: Number, required: true },
      Height: { type: Number, required: true },
      Left: { type: Number, required: true },
      Top: { type: Number, required: true },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const FaceMatch: Model<IFaceMatch> =
  mongoose.models.FaceMatch ||
  mongoose.model<IFaceMatch>("FaceMatch", FaceMatchSchema);

export default FaceMatch;
