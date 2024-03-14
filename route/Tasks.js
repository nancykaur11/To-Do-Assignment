const express = require("express");
const router = express.Router();
const Task = require("../model/Task.js");
const SubTask = require("../model/SubTask.js");
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, "123Data", (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
       
       next();
    });
};

router.post('/', authenticateToken,async (req, res) => {
    try {
      const task = await Task.create(req.body);
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });


  router.get("/",authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;

        const { priority, status, dueDate } = req.query;

        if (!userId) {
            return res.status(403).json({ message: "User not found!" });
        }

        const filter = { userId, deletedAt: null };
        if (priority) filter.priority = priority;
        if (status) filter.status = status;
        if (dueDate) filter.dueDate = { $lte: new Date(dueDate) };

        const tasks = await Task.find(filter);

        return res.json(tasks);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});



router.patch("/:task_id", authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.task_id;

        const { dueDate, status, taskTitle, taskDescription } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(404).send("User not found!");
        }

        if (!taskId) {
            return res.status(400).send("Task ID is required.");
        }

        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).send("Task not found.");
        }

        if (task?.deletedAt != null) {
            return res.status(400).send(`Task was deleted on: ${task?.deletedAt}`);
        }

        if (task.userId != userId) {
            return res.status(401).send("You can't update this task!");
        }

        if (dueDate) {
            task.dueDate = dueDate;
        }
        if (status) {
            task.status = status;
        }
        if (taskTitle) {
            task.taskTitle = taskTitle;
        }
        if (taskDescription) {
            task.taskDescription = taskDescription;
        }

        await task.save();

        res.json({ message: "Task updated successfully.", task });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});


router.delete("/:task_id", authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.task_id;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(404).send("User not found!");
        }

        if (!taskId) {
            return res.status(400).send("Task ID is required.");
        }

        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).send("Task not found.");
        }

        if (task?.deletedAt != null) {
            return res.status(400).send(`Task already deleted on: ${task?.deletedAt}`);
        }

        if (task?.userId != userId) {
            return res.status(401).send("You can't delete this task!");
        }

        const subtasks = await SubTask.find({ parentTaskId: task._id });

        for (const subtask of subtasks) {
            subtask.deletedAt = new Date();
            await subtask.save();
        }

        task.deletedAt = new Date();
        await task.save();

        return res.json({ message: "Task deleted successfully.", task });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

module.exports = router;
