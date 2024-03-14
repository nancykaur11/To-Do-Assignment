const express = require("express");
const jwt = require("jsonwebtoken");
const SubTask = require("../model/SubTask");
const Task = require("../model/Task");

const authenticateToken = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return next("Authentication failed!");
    }

    const token = req.headers.authorization.split(" ")[1];
    if (!token) return next(401, "Authentication failed!");

    const decoded = jwt.verify(token, "123Data");
    req.user = decoded;
    return next();
  } catch (error) {
    return next(401, "Invalid or expired token");
  }
};

const updateTaskStatus = async (taskId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw 404, "Task not found.";
  }

  const subtasks = await SubTask.find({ task: taskId, deletedAt: null });

  if (subtasks.every((subtask) => subtask.taskStatus === 1)) {
    task.taskStatus = "DONE";
  } else if (subtasks.some((subtask) => subtask.taskStatus === 1)) {
    task.taskStatus = "IN_PROGRESS";
  } else {
    task.taskStatus = "TO_DO";
  }

  await task.save();
};

const router = express.Router();

router.post("/", authenticateToken, async (req, res, next) => {
  try {
    const { taskId } = req.body;
    const user = req.user;
    if (!user) {
      return next(401, "User not found!");
    }

    if (!taskId) {
      return next(404, "Task ID is required.");
    }

    const newSubTask = new SubTask({
      parentTaskId: taskId,
    });

    const savedSubTask = await newSubTask.save();
    await updateTaskStatus(taskId);

    await res.status(201).json({
      message: "Subtask created successfully.",
      subTask: savedSubTask,
    });
  } catch (error) {
    return next(error.statusCode, error.message);
  }
});

router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const user = req.user;
    const { taskId } = req.query;

    if (!user) {
      return next(401, "User not found!");
    }

    let filter = {};
    if (!taskId) {
      const tasks = await Task.find({ userId: user.id });

      const taskIds = tasks.map((task) => task._id);
      filter =
        taskIds.length > 0
          ? { parentTaskId: { $in: taskIds }, deletedAt: null }
          : { deletedAt: null };
    } else {
      filter = { parentTaskId: taskId, deletedAt: null };
    }

    const subTasks = await SubTask.find(filter);

    return res.json({ subTasks });
  } catch (error) {
    return next(
      error.statusCode || 500,
      error.message || "Internal Server Error"
    );
  }
});

router.patch("/:subtask_id", authenticateToken, async (req, res, next) => {
  try {
    const subtaskId = req.params.subtask_id;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return next(404, "User not found!");
    }

    if (!subtaskId) {
      return next(400, "Subtask ID is required.");
    }

    const subtask = await SubTask.findById(subtaskId);

    if (!subtask) {
      return next(404, "Subtask not found.");
    }

    if (subtask?.deletedAt != null) {
      return next(
        400,
        `Subtask was deleted on: ${subtask?.deletedAt}`
      );
    }

    const task = await Task.findById(subtask.parentTaskId);
    if (!task) {
      return next(404, "Task not found for this subtask");
    }
    if (task?.userId != userId) {
      return next(401, "You can't update this subtask!");
    }

    if (status !== undefined) {
      subtask.taskStatus = status;
    }

    await subtask.save();

    await updateTaskStatus(subtask.parentTaskId);

    res.json({ message: "Subtask updated successfully.", subtask });
  } catch (error) {
    return next(
      error.statusCode || 500,
      error.message || "Internal Server Error"
    );
  }
});

router.delete("/:subtask_id", authenticateToken, async (req, res, next) => {
  try {
    const subtaskId = req.params.subtask_id;
    const userId = req.user?.id;

    if (!userId) {
      return next(404, "User not found!");
    }

    if (!subtaskId) {
      return next(400, "Subtask ID is required.");
    }

    const subtask = await SubTask.findById(subtaskId);

    if (!subtask) {
      return next(404, "Subtask not found.");
    }
    if (subtask?.deletedAt != null) {
      return next(
        400,
        `Subtask already deleted on: ${subtask?.deletedAt}`
      );
    }

    const task = await Task.findById(subtask.parentTaskId);
    if (!task) {
      return next(404, "Task not found for this subtask");
    }
    if (task?.userId != userId) {
      return next(401, "You can't delete this subtask!");
    }

    subtask.deletedAt = new Date();

    await subtask.save();
    await updateTaskStatus(subtask.parentTaskId);

    res.json({ message: "Subtask deleted successfully.", subtask });
  } catch (error) {
    return next(
      error.statusCode || 500,
      error.message || "Internal Server Error"
    );
  }
});

module.exports = router;
