import express from "express";
import { getResults } from "../controllers/resultController.js";
import { auth } from "../middleware/AuthMiddleware.js"; 

const router = express.Router();

router.use(auth);

router.get("/", getResults);

export default router;