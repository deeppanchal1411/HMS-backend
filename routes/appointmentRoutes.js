import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { cancelAppointment, createAppointment, getMyAppointments, getRecentAppointments } from "../controllers/appointmentController.js";

const appointmentRoutes = express.Router();

appointmentRoutes.post('/', authenticate, createAppointment);
appointmentRoutes.get('/my-appointments', authenticate, getMyAppointments);
appointmentRoutes.get('/recent', authenticate, getRecentAppointments);
appointmentRoutes.put('/cancel/:id', authenticate, cancelAppointment);

export default appointmentRoutes;