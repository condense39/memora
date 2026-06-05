import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: "admin" | "user";
  googleId?: string;
  rekognitionFaceId?: string;
  selfieUrl?: string;
  selfieS3Key?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    googleId: {
      type: String,
      default: null,
    },
    rekognitionFaceId: {
      type: String,
      default: null,
    },
    selfieUrl: {
      type: String,
      default: null,
    },
    selfieS3Key: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
