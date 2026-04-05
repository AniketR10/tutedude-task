const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    color: { type: String, required: true },
    lastPosition: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
