import express from "express";
import { getDoctorsForPatient, getPatientProfile, loginPatient, registerPatient, updatePatientPassword, updatePatientProfile } from "../controllers/patientController.js"
import { authenticate } from "../middleware/authMiddleware.js";

const patientRoutes = express.Router();

// Register/Login
patientRoutes.post('/register', registerPatient);
patientRoutes.post('/login', loginPatient);

// Patient profile
patientRoutes.get('/profile', authenticate, getPatientProfile);
patientRoutes.put('/edit-profile', authenticate, updatePatientProfile);
patientRoutes.put('/update-password', authenticate, updatePatientPassword);

patientRoutes.get('/doctors', authenticate, getDoctorsForPatient);

export default patientRoutes;