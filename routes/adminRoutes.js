import express from "express";
import { deleteDoctorByAdmin, deletePatient, getAdminProfile, getAdminStats, getAllAppointments, getAllDoctors, getAllPatients, loginAdmin, registerAdmin, updateAppointmentStatus, updateDoctorByAdmin } from "../controllers/adminController.js";
import { authenticate, isAdmin } from "../middleware/authMiddleware.js";
import { registerDoctor } from "../controllers/doctorController.js";

const adminRoutes = express.Router();

// Admin Registeration
adminRoutes.post('/register', registerAdmin);

// Admin Login
adminRoutes.post('/login', loginAdmin);

// Admin Profile
adminRoutes.get('/profile', authenticate, isAdmin, getAdminProfile);

// Doctor Profile
adminRoutes.post('/doctor/register', authenticate, isAdmin, registerDoctor);
adminRoutes.get('/doctors', authenticate, isAdmin, getAllDoctors);
adminRoutes.put('/doctors/:id', authenticate, isAdmin, updateDoctorByAdmin);
adminRoutes.delete('/doctors/:id', authenticate, isAdmin, deleteDoctorByAdmin);

// Patients Profile
adminRoutes.get('/patients', authenticate, isAdmin, getAllPatients);
adminRoutes.delete('/patients/:id', authenticate, isAdmin, deletePatient);

// Appointments
adminRoutes.get('/appointments', authenticate, isAdmin, getAllAppointments);
adminRoutes.patch('/appointments/:id/status', authenticate, isAdmin, updateAppointmentStatus);

// AdminStats
adminRoutes.get('/stats', authenticate, isAdmin, getAdminStats);

export default adminRoutes;