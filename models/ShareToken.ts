import mongoose, { Schema, Document, Types } from "mongoose";

export interface IShareToken extends Document {
  token: string;
  mediaId: Types.ObjectId;
  createdBy: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

const ShareTokenSchema = new Schema<IShareToken>(
  {
    token: { type: String, required: true, unique: true, index: true },
    mediaId: { type: Schema.Types.ObjectId, ref: "Media", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Auto-delete expired tokens using MongoDB TTL index
ShareTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.ShareToken ||
  mongoose.model<IShareToken>("ShareToken", ShareTokenSchema);
