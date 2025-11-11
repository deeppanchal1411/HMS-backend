import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";

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

        const newAppointment = new Appointment({
            patient: patientId,
            doctor: doctorId,
            doctorName: doctor.name,
            department,
            date,
            time,
            symptoms
        });

        await newAppointment.save();

        res.status(201).json({
            message: "Appointment booked successfully",
            appointment: newAppointment
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const getMyAppointments = async (req, res) => {
    try {
        const patientId = req.loggedInUser.id;
        const { date, time, status, doctorName } = req.query;  

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
                name: { $regex: doctorName, $options: "i" }  
            }).select("_id");  
            const doctorIds = doctors.map(d => d._id);
            filter.doctor = { $in: doctorIds };
        }

        const appointments = await Appointment.find(filter)
            .sort({ date: 1, time: 1 })  
            .populate("doctor", "name specialization") 
            .populate("patient", "name phone"); 

        res.status(200).json({ appointments });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


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


export const cancelAppointment = async (req, res) => {
    try {
        const patientId = req.loggedInUser.id;
        const appointmentId = req.params.id;

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

        appointment.status = "cancelled";
        await appointment.save();

        res.status(200).json({
            message: "Appointment cancelled successfully",
            appointment
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


function generateSlots(start, end, interval = 15) {
    const slots = [];
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);

    let current = new Date(0, 0, 0, startHour, startMin);
    const endTime = new Date(0, 0, 0, endHour, endMin);

    while (current < endTime) {
        const hours = current.getHours().toString().padStart(2, "0");
        const minutes = current.getMinutes().toString().padStart(2, "0");
        slots.push(`${hours}:${minutes}`);
        current.setMinutes(current.getMinutes() + interval);
    }

    return slots;
};

export const getAvailableSlots = async (req, res) => {
    try {
        const { doctorId, date } = req.query;

        if (!doctorId || !date) {
            return res.status(400).json({ message: "Doctor ID and date are required" });
        }

        const doctor = await Doctor.findById(doctorId).select("availability");

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "long" });

        const dayAvailability = doctor.availability.find(day => day.day === dayOfWeek);

        if (!dayAvailability) {
            return res.status(200).json({ slots: [] });
        }

        const allSlots = generateSlots(dayAvailability.startTime, dayAvailability.endTime);

        const appointments = await Appointment.find({
            doctor: doctorId,
            date,
            status: { $ne: "cancelled" }
        });

        const bookedTimes = appointments.map(a => a.time);

        const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

        res.status(200).json({ slots: availableSlots });

    } catch (err) {
        console.error("Error fetching available slots:", err);
        res.status(500).json({ message: "Server error" });
    }
};