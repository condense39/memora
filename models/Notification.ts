import mongoose, { Document, Model, Schema } from "mongoose";

export type NotificationType =
  | "like"
  | "comment"
  | "tag"
  | "share"
  | "face_match";

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  type: NotificationType;
  entityId?: string;
  entityType?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient ID is required"],
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Actor ID is required"],
    },
    type: {
      type: String,
      enum: ["like", "comment", "tag", "share", "face_match"],
      required: [true, "Notification type is required"],
    },
    entityId: {
      type: String,
      default: null,
    },
    entityType: {
      type: String,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
