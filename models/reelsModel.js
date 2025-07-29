import mongoose from 'mongoose';

const reelSchema = new mongoose.Schema({
  videoUrl: {
    type: String,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
   comments: [
    {
      text: String,
      commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
    }
  ],
});

const Reel = mongoose.model('Reel', reelSchema);

export default Reel;
