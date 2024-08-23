import express from "express";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.static("client"));

app.get("/", (req, res) => {
  res.sendFile(path.resolve("./client/index.html"));
});

app.listen(3000, () => {
  console.log(`Node server listening at http://localhost:3000/`);
});
