const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    dueDate: { type: String },
    priority: Number, 
    status: { type: String, enum: ["TO_DO", "IN_PROGRESS", "DONE"], default: "TO_DO" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
    deletedAt: { type: Date, default: null },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserModified",
        required: true,
      },
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;

