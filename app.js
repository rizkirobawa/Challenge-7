require("dotenv").config();
const express = require("express");
const logger = require("morgan");
const path = require("path");
const router = require("./routes/v1");
const app = express();
const Sentry = require("./libs/sentry");

// Sentry
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// view engine setup
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(logger("dev"));
app.use(express.json());
app.use(router);

app.get("/", (req, res) =>
  res.json({
    status: true,
    message: "Hello World!",
    data: null,
  })
);

app.use(Sentry.Handlers.errorHandler());

// 500 error handler
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({
    status: false,
    message: err.message,
    data: null,
  });
});

// 404 error handler
app.use((req, res, next) => {
  res.status(404).json({
    status: false,
    message: `are you lost? ${req.method} ${req.url} is not registered!`,
    data: null,
  });
});

// socket.io
const server = require('http').createServer(app);
global.io = require("socket.io")(server);

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});

module.exports = app;
