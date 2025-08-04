import mongoose from 'mongoose';

const wordSchema = new mongoose.Schema({
  word: { type: String, required: true, unique: true },
  frequency: { type: Number, default: 1 },
  contexts: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const contextSchema = new mongoose.Schema({
  sentence: { type: String, required: true },
  words: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

export const Word = mongoose.models.Word || mongoose.model('Word', wordSchema);
export const Context = mongoose.models.Context || mongoose.model('Context', contextSchema);
