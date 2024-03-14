const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../model/User.js");

router.post("/register", async (req, res) => {
    try {
        const { phoneNumber, priority } = req.body;

        if (!phoneNumber || !priority) {
            return res.status(400).json({ error: "Phone number and priority are required." });
        }

        let priorityNumber;
        if (isNaN(priority)) {
            switch (priority.toLowerCase()) {
                case "high":
                    priorityNumber = 1;
                    break;
                case "medium":
                    priorityNumber = 2;
                    break;
                case "low":
                    priorityNumber = 3;
                    break;
                default:
                    return res.status(400).json({ error: "Invalid priority value." });
            }
        } else {
            priorityNumber = parseInt(priority);
        }

        const checkUser = await User.findOne({ phoneNumber });
        if (checkUser) {
            return res.status(400).json({ error: "User already exists with this phone number!" });
        }

        const newUser = new User({
            phoneNumber,
            priority: priorityNumber, 
        });

        const savedUser = await newUser.save();
        const token = jwt.sign({ id: savedUser._id }, "Komal", {
            expiresIn: "1 year",
        });

        res.status(201).json({ message: "User created successfully.", user: newUser, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



router.get("/:id" ,async (req, res) => {
    try {
      const userId = req.params.id;
  
     
      if (!userId) {
        return (400, "User ID is required.");
      }
  
      
      const user = await User.findById(userId);
  
      if (!user) {
        return (404, "User not found.");
      }
  
      res.json(user);
    } catch (error) {
      return (error, "Internal Server Error");
    }
  });

module.exports = router;

