import express from "express";
import { updateUserToAgent } from "../controllers/agentController";

const agentRouter = express.Router();

// Add Agent Roles
agentRouter.get('/update-role', updateUserToAgent);


export default agentRouter;