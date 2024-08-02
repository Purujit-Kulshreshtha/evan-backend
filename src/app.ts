import express, { Application, Request, Response } from "express";

const app: Application = express();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello");
});

app.listen(8080, () => console.log("Server running on port 8080"));