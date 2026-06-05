import mongoose, { Document, Model, Schema } from "mongoose";

export type EventCategory =
  | "photoshoot"
  | "workshop"
  | "trip"
  | "competition"
  | "cultural"
  | "party"
  | "other";

export type EventVisibility = "public" | "private";

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  category: EventCategory;
  date: Date;
  coverImageUrl?: string;
  coverImageS3Key?: string;
  createdBy: mongoose.Types.ObjectId;
  visibility: EventVisibility;
  members: {
    userId: mongoose.Types.ObjectId;
    role: "club_admin" | "club_member";
  }[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    name: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
      index: "text",
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: [
        "photoshoot",
        "workshop",
        "trip",
        "competition",
        "cultural",
        "party",
        "other",
      ],
      default: "other",
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    coverImageUrl: {
      type: String,
      default: null,
    },
    coverImageS3Key: {
      type: String,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    members: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["club_admin", "club_member"],
          default: "club_member",
        },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ name: "text", description: "text" });

const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

export default Event;
