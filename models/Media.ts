import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMedia extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  fileUrl: string;
  thumbnailUrl: string;
  s3Key: string;
  type: "photo" | "video";
  mediaVisibility: "public" | "private";
  size?: number;
  width?: number;
  height?: number;
  aiTags: string[];
  likes: mongoose.Types.ObjectId[];
  favouritedBy: mongoose.Types.ObjectId[];
  downloadCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader is required"],
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    s3Key: {
      type: String,
      required: [true, "S3 key is required"],
    },
    type: {
      type: String,
      enum: ["photo", "video"],
      default: "photo",
    },
    mediaVisibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    size: {
      type: Number,
      default: null,
    },
    width: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    aiTags: [
      {
        type: String,
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    favouritedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    downloadCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Media: Model<IMedia> =
  mongoose.models.Media || mongoose.model<IMedia>("Media", MediaSchema);

export default Media;
