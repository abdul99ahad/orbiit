import mongoose, { Document, Schema } from 'mongoose';

export type JoinRequestStatus = 'pending' | 'approved' | 'denied';

export interface JoinRequestDocument extends Document {
  userId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  status: JoinRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const joinRequestSchema = new Schema<JoinRequestDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const JoinRequestModel = mongoose.model<JoinRequestDocument>(
  'JoinRequest',
  joinRequestSchema
);

export default JoinRequestModel;
