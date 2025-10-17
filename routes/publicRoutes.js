import express from "express";
import { getPublicDoctors } from "../controllers/doctorController.js";

const publicRoutes = express.Router();

publicRoutes.get('/doctors', getPublicDoctors);

export default publicRoutes;