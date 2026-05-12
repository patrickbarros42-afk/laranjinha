import { Router, type Router as ExpressRouter } from "express";

export const healthRoutes: ExpressRouter = Router();

healthRoutes.get("/", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "meu-laranjinha",
    timestamp: new Date().toISOString()
  });
});
