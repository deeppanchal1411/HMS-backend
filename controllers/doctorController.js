import Doctor from "../models/Doctor.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import dayjs from "dayjs";

// Registeres new doctor
export const registerDoctor = async (req, res) => {

    const { name, phone, specialization, experience, gender, password } = req.body;

    try {
        // Checks if the doctor already registered by phone
        const existingDoctor = await Doctor.findOne({ phone });

        if (existingDoctor) {
            return res.status(400).json({ message: "Doctor already exist" });
        }

        // Creates new doctor
        const newDoctor = new Doctor({
            name,
            phone,
            specialization,
            experience,
            gender,
            password
        });

        // Saves new doctor
        await newDoctor.save();

        // Send response to frontend
        res.status(201).json({
            message: "Doctor registered successfully",
            doctor: {
                id: newDoctor._id,
                name: newDoctor.name,
                phone: newDoctor.phone,
                specialization: newDoctor.specialization,
            }
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


// Login for doctor 
export const loginDoctor = async (req, res) => {

    const { phone, password } = req.body;

    try {
        // Checks that the doctor is there or not
        const doctor = await Doctor.findOne({ phone });
        if (!doctor) {
            return res.status(404).josn({ message: "Doctor not found" });
        }

        // Compares the password
        const isMatch = await bcrypt.compare(password, doctor.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Creates token
        const token = jwt.sign(
            { id: doctor._id, role: doctor.role },  // Payload
            process.env.JWT_SECRET,  // Secret
            { expiresIn: "2h" }  // Options
        );

        // Sends response to frontend
        res.status(200).json({
            message: "Login successful",
            token,
            doctor: {
                id: doctor._id,
                name: doctor.name,
                phone: doctor.phone,
                specialization: doctor.specialization,
                role: doctor.role
            }
        });

    } catch (err) {
        res.status(500).josn({ error: "Server error" });
    }
};


// Gets a profile of doctor
export const getDoctorProfile = async (req, res) => {
    try {
        const doctorId = req.loggedInUser.id;

        // Finds the doctor and select all data except password
        const doctor = await Doctor.findById(doctorId).select("-password");

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        // Send reponse to frontend
        res.status(200).json({
            message: "Doctor profile fetched successfully",
            doctor
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


// Updates doctor profile
export const updateDoctorProfile = async (req, res) => {
    try {
        const doctorId = req.loggedInUser.id;

        const { name, phone, specialization, experience, gender } = req.body;

        const updates = { name, phone, specialization, experience, gender };

        // Finds doctor by ID and update profile
        const updatedDoctor = await Doctor.findByIdAndUpdate(
            doctorId,
            updates,
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedDoctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        res.status(200).json({
            message: "Doctor profile updated successfully",
            doctor: updatedDoctor
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


// Update doctor password
export const updateDoctorPassword = async (req, res) => {
    try {
        const doctorId = req.loggedInUser.id;
        const { currentPassword, newPassword } = req.body;

        // Checks if doctor exist
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).josn({ message: "Doctor not found" });
        }

        // Compares the password
        const isMatch = await bcrypt.compare(currentPassword, doctor.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Password is incorrect" });
        }

        // Assign the new password 
        doctor.password = newPassword;
        await doctor.save();  // Saves 

        return res.status(200).json({ message: "Password updated successfully" });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


// View doctor's appointments
export const getDoctorAppointments = async (req, res) => {
    try {
        const doctorId = req.loggedInUser.id;
        const { date, time, status, patientName } = req.query;  // Reads filters form query params

        // Pass doctor ID so doctor only sees their appointments
        const filter = { doctor: doctorId };

        if (date) {
            const selectedDate = new Date(date);
            selectedDate.setHours(0, 0, 0, 0);

            const nextDate = new Date(selectedDate);
            nextDate.setDate(nextDate.getDate() + 1);

            filter.date = { $gte: selectedDate, $lt: nextDate };
        }

        if (time) filter.time = time;

        if (status) filter.status = status;

        if (patientName) {
            const matchedPatients = await Patient.find({
                name: { $regex: patientName, $options: "i" }  // $regex => allows partial matching  "i" => makes it case-sensitive
            }).select("_id");  // Returns ID of all patients that matches name

            const matchIds = matchedPatients.map(p => p._id);
            filter.Patient = { $in: matchIds };
        }

        // Finds and filters
        const appointments = await Appointment.find(filter)
            .sort({ date: 1, time: 1 })  // Sorts by ascending
            .populate("patient", "name email phone age gender");  // Gets patient info from patient DB

        // Sends response to frontend
        res.status(200).json({ appointments });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


// Updates status of appointment
export const updateAppointmentStatus = async (req, res) => {
    try {
        const doctorId = req.loggedInUser.id;
        const appointmentId = req.params.id;
        const { status } = req.body;

        // Finds appointment by its ID
        const appointment = await findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Checks that the appointment belongs to the logged-in doctor
        if (appointment.doctor.toString() !== doctorId) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Updates and saves the status
        appointment.status = status;
        await appointment.save();

        // Sends response to frontend
        res.status(200).json({
            message: "Appointment status updated",
            appointment
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


// Shows a summary of appointments
export const getDoctorDashboard = async (req, res) => {
    try {
        const doctorId = req.loggedInUser.id;
        const today = dayjs().format("YYYY-MM-DD");

        // Gets counts of appointments
        const totalAppointments = await Appointment.countDocuments({ doctor: doctorId });

        const pendingAppointments = await Appointment.countDocuments({
            doctor: doctorId,
            status: "pending"
        });

        const completedAppointments = await Appointment.countDocuments({
            doctor: doctorId,
            status: "completed"
        });

        const cancelledAppointments = await Appointment.countDocuments({
            doctor: doctorId,
            status: "cancelled"
        });

        const todayAppointments = await Appointment.countDocuments({
            doctor: doctorId,
            date: today
        });

        // Sends response to frontend
        res.status(200).json({
            totalAppointments,
            pendingAppointments,
            completedAppointments,
            cancelledAppointments,
            todayAppointments
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


// Updates notes of an appointment
export const updateAppointmentNotes = async (req, res) => {
    try {
        const doctorId = req.loggedInUser.id;
        const appointmentId = req.params.id;
        const { notes } = req.body;

        // Finds appointment by ID
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.doctor.toString() !== doctorId) {
            return res.status(403).json({ message: "Access denied" });
        }

        appointment.notes = notes;
        await appointment.save();  // Saves the appointment with notes

        // Sends response to frontend
        res.status(200).json({
            message: "Notes updated",
            appointment
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


// Gets patient's history
export const getPatientHistory = async (req, res) => {
    try {
        const doctorId = req.loggedInUser.id;
        const patientId = req.params.id;

        // Finds patient's all appointments and his details
        const history = await Appointment.find({
            doctor: doctorId,
            patient: patientId,
        }).sort({ date: -1, time: -1 })  // Sort in descending
            .select("date time status notes")
            .populate("patient", "name email age gender phone");

        // Sends response to frontend
        res.status(200).json({ history });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


// Gets doctors for public page
export const getPublicDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({}, "name specialization experience image gender");
        res.json(doctors);

    } catch (err) {
        res.status(500).json({ error: "Failed to fetch doctors" });
    }
};


export const getDoctorPatients = async (req, res) => {
    try {
        const doctorId = req.user.id;

        const appointments = await Appointment.find({ doctor: doctorId }).populate("patient");

        const uniquePatients = {};
        appointments.forEach(appt => {
            if (appt.patient) {
                uniquePatients[appt.patient._id] = appt.patient;
            }
        });

        res.json(Object.values(uniquePatients));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch patients" });
    }
};