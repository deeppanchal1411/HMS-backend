import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";

// Create appointment
export const createAppointment = async (req, res) => {
    try {
        const patientId = req.loggedInUser.id;
        const { doctorId, date, time, symptoms, department } = req.body;

        if (!doctorId || !date || !time || !symptoms || !department) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        // Creates new appointment
        const newAppointment = new Appointment({
            patient: patientId,
            doctor: doctorId,
            doctorName: doctor.name,
            department,
            date,
            time,
            symptoms
        });

        // Saves appointment
        await newAppointment.save();

        // Sends to frontend
        res.status(201).json({
            message: "Appointment booked successfully",
            appointment: newAppointment
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


// Get all appointments and filter
export const getMyAppointments = async (req, res) => {
    try {
        const patientId = req.loggedInUser.id;
        const { date, time, status, doctorName } = req.query;  // Reads filters from query params

        // Pass patient ID so patient only see their appointment
        const filter = { patient: patientId };

        if (date) {
            filter.date = date;
        }

        if (time) {
            filter.time = time;
        }

        if (status) {
            filter.status = status;
        }

        if (doctorName) {
            const doctors = await Doctor.find({
                name: { $regex: doctorName, $options: "i" }  // $regex => allows partial matching  "i" => makes it case-sensitive
            }).select("_id");  // Selects doctor's ID
            const doctorIds = doctors.map(d => d._id);
            filter.doctor = { $in: doctorIds };
        }

        // Finds and filter appointment
        const appointments = await Appointment.find(filter)
            .sort({ date: 1, time: 1 })  // Sort by upcoming(ascending)
            .populate("doctor", "name specialization") // Doctor info
            .populate("patient", "name phone");  // Get basic patient info(from patient DB)

        // Sends to frontend
        res.status(200).json({ appointments });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


// Upcoming-appintment
export const getRecentAppointments = async (req, res) => {
    try {
        const patientId = new mongoose.Types.ObjectId(req.loggedInUser.id);

        const appointment = await Appointment.find({ patient: patientId })
            .sort({ date: -1 })
            .limit(3);

        if (appointment.length === 0) {
            return res.json([]);
        }

        res.json(appointment);

    } catch (err) {
        console.error('Error fetching appointments:', err.message);
        console.error(err.stack);
        res.status(500).json({ error: err.message });
    }
};


// Cancel appointment
export const cancelAppointment = async (req, res) => {
    try {
        const patientId = req.loggedInUser.id;
        const appointmentId = req.params.id;

        // Finds the appointment by its ID and loggedInUser's ID
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            patient: patientId
        });

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found or unauthorized" });
        }

        if (appointment.status !== "pending") {
            return res.status(400).json({ message: "Only pending appointments can be cancelled" });
        }

        if (appointment.status === "cancelled") {
            return res.status(400).json({ message: "Appointment already cancelled" });
        }

        // Sets the status of appoinntment to "cancelled"
        appointment.status = "cancelled";
        await appointment.save();

        // Sends to frontend
        res.status(200).json({
            message: "Appointment cancelled successfully",
            appointment
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};