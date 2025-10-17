import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { getDoctorAppointments, getDoctorDashboard, getDoctorPatients, getDoctorProfile, getPatientHistory, loginDoctor, updateAppointmentNotes, updateAppointmentStatus, updateDoctorPassword, updateDoctorProfile } from "../controllers/doctorController.js";

const doctorRoutes = express.Router();

// Login
doctorRoutes.post('/login', loginDoctor);

// Doctor profile
doctorRoutes.get('/profile', authenticate, getDoctorProfile);
doctorRoutes.put('/profile', authenticate, updateDoctorProfile);
doctorRoutes.put('/update-password', authenticate, updateDoctorPassword);

// Appointments
doctorRoutes.get('/appointments', authenticate, getDoctorAppointments);
doctorRoutes.patch('/appointments/:id/status', authenticate, updateAppointmentStatus);
doctorRoutes.get('/dashboard', authenticate, getDoctorDashboard);
doctorRoutes.put('/appointments/:id/notes', authenticate, updateAppointmentNotes);

// Patients
doctorRoutes.get('/patients', authenticate, getDoctorPatients);
doctorRoutes.get('/patients/:id/history', authenticate, getPatientHistory);

export default doctorRoutes;