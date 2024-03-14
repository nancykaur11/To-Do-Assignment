const mongoose = require("mongoose");

const subTaskSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  status: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: {
    type: Date,
    default: null,
  },
  deleted_at: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("SubTask", subTaskSchema);
