import mongoose, { Document, Model, Schema } from "mongoose";

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  mediaId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  taggedUsers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
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
    },
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    taggedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Comment: Model<IComment> =
  mongoose.models.Comment ||
  mongoose.model<IComment>("Comment", CommentSchema);

export default Comment;
