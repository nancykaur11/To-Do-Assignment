const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
app.use(express.json());
const userRoute = require("./route/User");
const taskRoute = require("./route/Tasks");
const subTaskRoute = require("./route/SubTask");

const corsConfig = {
  credentials: true,
  origin: true,
};
app.use(cors(corsConfig));
app.use(morgan("tiny"));
const port = 3000;
const connectToDatabase = () => {
  mongoose.set("strictQuery", true);
  mongoose
    .connect(
      "mongodb+srv://nancykaur:komalapp@cluster0.fgbj8ui.mongodb.net/Reserveapp"
    )
    .then(() => {
      console.log("MongoDB connected successfully");
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
    });
};

app.use("/api/user/", userRoute);
app.use("/api/task/", taskRoute);
app.use("/api/sub-task/", subTaskRoute);
app.listen(port, () => {
  console.log("Server started on port", port);
  connectToDatabase();
});
