import Doctor from "../models/Doctor.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import dayjs from "dayjs";

export const registerDoctor = async (req, res) => {

    const { name, phone, specialization, experience, gender, password } = req.body;

    try {
        const existingDoctor = await Doctor.findOne({ phone });

        if (existingDoctor) {
            return res.status(400).json({ message: "Doctor already exist" });
        }

        const newDoctor = new Doctor({
            name,
            phone,
            specialization,
            experience,
            gender,
            password
        });

        await newDoctor.save();

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


export const loginDoctor = async (req, res) => {

    const { phone, password } = req.body;

    try {
        const doctor = await Doctor.findOne({ phone });
        if (!doctor) {
            return res.status(404).josn({ message: "Doctor not found" });
        }

        const isMatch = await bcrypt.compare(password, doctor.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = jwt.sign(
            { id: doctor._id, role: doctor.role },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

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


export const getDoctorProfile = async (req, res) => {
    try {
        const doctorId = req.loggedInUser.id;

        const doctor = await Doctor.findById(doctorId).select("-password");

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        res.status(200).json({
            message: "Doctor profile fetched successfully",
            doctor
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const updateDoctorProfile = async (req, res) => {
    try {
        const doctorId = req.loggedInUser.id;

        const { name, phone, specialization, experience, gender } = req.body;

        const updates = { name, phone, specialization, experience, gender };

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


export const updateDoctorPassword = async (req, res) => {
    try {
        const doctorId = req.loggedInUser.id;
        const { currentPassword, newPassword } = req.body;

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).josn({ message: "Doctor not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, doctor.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Password is incorrect" });
        }

        doctor.password = newPassword;
        await doctor.save();

        return res.status(200).json({ message: "Password updated successfully" });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const getDoctorAppointments = async (req, res) => {
    try {
        const doctorId = req.loggedInUser.id;
        const { date, time, status, patientName } = req.query;

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
                name: { $regex: patientName, $options: "i" }
            }).select("_id");

            const matchIds = matchedPatients.map(p => p._id);
            filter.Patient = { $in: matchIds };
        }

        const appointments = await Appointment.find(filter)
            .sort({ date: 1, time: 1 })
            .populate("patient", "name email phone age gender");

        res.status(200).json({ appointments });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const updateAppointmentStatus = async (req, res) => {
    try {
        const doctorId = req.loggedInUser.id;
        const appointmentId = req.params.id;
        const { status } = req.body;

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.doctor.toString() !== doctorId) {
            return res.status(403).json({ message: "Access denied" });
        }

        appointment.status = status;
        await appointment.save();

        res.status(200).json({
            message: "Appointment status updated",
            appointment
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const getDoctorDashboard = async (req, res) => {
    try {
        const doctorId = req.loggedInUser.id;
        const today = dayjs().format("YYYY-MM-DD");

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

        const recentAppointments = await Appointment.find({ doctor: doctorId })
            .sort({ dateTime: -1 })     
            .limit(5)                   
            .populate("patient", "name phone");

        res.status(200).json({
            totalAppointments,
            pendingAppointments,
            completedAppointments,
            cancelledAppointments,
            todayAppointments,
            recentAppointments
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const updateAppointmentNotes = async (req, res) => {
    try {
        const doctorId = req.loggedInUser.id;
        const appointmentId = req.params.id;
        const { notes } = req.body;

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.doctor.toString() !== doctorId) {
            return res.status(403).json({ message: "Access denied" });
        }

        appointment.notes = notes;
        await appointment.save();

        res.status(200).json({
            message: "Notes updated",
            appointment
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const getPatientHistory = async (req, res) => {
    try {
        const doctorId = req.loggedInUser.id;
        const patientId = req.params.id;

        const history = await Appointment.find({
            doctor: doctorId,
            patient: patientId,
        }).sort({ date: -1, time: -1 })
            .select("date time status notes")
            .populate("patient", "name email age gender phone");

        res.status(200).json({ history });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


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
        const doctorId = req.loggedInUser.id;

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


export const getDoctorAvailability = async (req, res) => {
    try {
        const doctorId = req.loggedInUser.id;

        const doctor = await Doctor.findById(doctorId).select("availability");

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        res.status(200).json({ availability: doctor.availability });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const updateDoctorAvailability = async (req, res) => {
    try {
        const doctorId = req.loggedInUser.id;
        const { availability } = req.body;

        if (!Array.isArray(availability)) {
            return res.status(400).json({ message: "Availability must be an array" });
        }

        const cleanedAvailability = availability.filter(
            (slot) =>
                slot.startTime && slot.endTime
        );

        const updatedDoctor = await Doctor.findByIdAndUpdate(
            doctorId,
            { availability: cleanedAvailability },
            { new: true, runValidators: true }
        ).select("availability");

        if (!updatedDoctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        res.status(200).json({
            message: "Availability updated successfully",
            availability: updatedDoctor.availability
        });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};