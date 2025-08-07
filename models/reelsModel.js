import mongoose from 'mongoose';

const reelSchema = new mongoose.Schema({
  mediaUrl: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'], // 👈 clearly define the type
    required: true,
  },
  caption: {
    type: String,
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [
    {
      text: String,
      commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Reel = mongoose.model('Reel', reelSchema);

export default Reel;
