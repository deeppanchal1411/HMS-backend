import Admin from "../models/Admin.js";
import Doctor from "../models/Doctor.js";
import patient from "../models/Patient.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Contact from "../models/contactModel.js";
import PublicContact from "../models/PublicContact.js";

export const registerAdmin = async (req, res) => {
    const { name, email, phone, password, role } = req.body;

    try {
        const existingAdmin = await Admin.findOne({ phone });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin already exists with this phone number" });
        }

        const newAdmin = new Admin({
            name,
            email,
            phone,
            password,
            role: role || 'admin' 
        });

        await newAdmin.save();

        res.status(201).json({
            message: "Admin registered successfully",
            admin: {
                id: newAdmin._id,
                name: newAdmin.name,
                email: newAdmin.email,
                phone: newAdmin.phone,
                role: newAdmin.role
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};


export const loginAdmin = async (req, res) => {
    const { phone, password } = req.body;

    try {
        const admin = await Admin.findOne({ phone });
        if (!admin) {
            return res.status(400).json({ message: "Admin not found" });
        }

        console.log("Password from request:", password);
        console.log("Hashed password from DB:", admin.password);

        const isMatch = await bcrypt.compare(password, admin.password);
        console.log("Password match result:", isMatch);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = jwt.sign(
            { id: admin._id, role: admin.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: "2h" }  
        );
  
        res.status(200).json({
            message: "Login successful",
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const getAdminProfile = async (req, res) => {
    try {
        const adminId = req.loggedInUser.id;

        const admin = await Admin.findById(adminId).select("-password");

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.status(200).json({ admin });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const getAllDoctors = async (req, res) => {
    try { 
        const doctors = await Doctor.find().select("-password");

        res.status(200).json({ doctors });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const updateDoctorByAdmin = async (req, res) => {
    try {
        const doctorId = req.params.id;
        const { name, phone, specialization, experience, gender } = req.body;

        const updatedData = { name, phone, specialization, experience, gender };

        const updatedDoctor = await Doctor.findByIdAndUpdate(
            doctorId,
            updatedData,
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedDoctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        res.status(200).json({
            message: "Doctor updated successfully",
            doctor: updatedDoctor
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const deleteDoctorByAdmin = async (req, res) => {
    try {
        const doctorId = req.params.id;

        const deletedDoctor = await Doctor.findByIdAndDelete(doctorId);

        if (!deletedDoctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        res.status(200).json({
            message: "Doctor deleted successfully",
            doctor: {
                id: deletedDoctor._id,
                name: deletedDoctor.name,
                email: deletedDoctor.email
            }
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const getAllPatients = async (req, res) => {
    try {
        const { search, sortBy = "name", order = "asc" } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },  
                { phone: { $regex: search, $options: "i" } }
            ];
        }

        const sortOptions = {};
        sortOptions[sortBy] = order === "desc" ? -1 : 1;

        const patients = await patient.find(query)
            .sort(sortOptions)
            .select("-password");

        res.status(200).json({ patients });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const deletePatient = async (req, res) => {
    try {
        const patientId = req.params.id;

        const deletedPatient = await Patient.findByIdAndDelete(patientId);

        if (!deletedPatient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        res.status(200).json({ message: "Patient deleted successfully" });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const getAllAppointments = async (req, res) => {
    try {
        const { search, doctorId, status, sortBy = "date", order = "asc" } = req.query;

        const filter = {};

        if (search) {
            const matchedPatients = await Patient.find({
                name: { $regex: search, $options: "i" }
            }).select("_id");

            const matchedIds = matchedPatients.map(p => p._id);
            filter.patient = { $in: matchedIds };
        }

        if (doctorId) {
            filter.doctor = doctorId;
        }

        if (status) {
            filter.status = status;
        }

        const sortOptions = {};
        sortOptions[sortBy] = order === "desc" ? -1 : 1;

        const appointments = await Appointment.find(filter)
            .populate("patient", "name email age gender phone")
            .populate("doctor", "name specialization")
            .sort(sortOptions);

        const formattedAppointments = appointments.map(appt => {
            let combinedDateTime = appt.date;
            if (appt.time) {
                const [hours, minutes] = appt.time.split(":").map(Number);
                combinedDateTime = new Date(appt.date);
                combinedDateTime.setHours(hours, minutes, 0, 0);
            }
            return {
                ...appt.toObject(),
                dateTime: combinedDateTime,
            };
        });

        res.status(200).json({ appointments: formattedAppointments });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ["pending", "completed", "cancelled"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        appointment.status = status;
        await appointment.save();

        res.status(200).json({ message: "Status updated", appointment });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const getAdminStats = async (req, res) => {
    try {
        const totalPatients = await Patient.countDocuments();
        const totalDoctors = await Doctor.countDocuments();
        const totalAppointments = await Appointment.countDocuments();

        const statusCounts = await Appointment.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todayAppointments = await Appointment.countDocuments({
            createdAt: { $gte: startOfDay, $lte: endOfDay }   
        });

        const recentAppointments = await Appointment.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("patient", "name phone")
            .populate("doctor", "name");

        res.status(200).json({
            totalPatients,
            totalDoctors,
            totalAppointments,
            todayAppointments,
            statusCounts,
            recentAppointments,
        });

    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};


export const getAllPublicContacts = async (req, res) => {
    try {
        const contacts = await PublicContact.find().sort({ createdAt: -1 });
        res.status(200).json({ contacts });

    } catch (err) {
        console.error("Error fetching public contacts:", err);
        res.status(500).json({ error: "Server error" });
    }
};


export const deletePublicContact = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedContact = await PublicContact.findByIdAndDelete(id);
        if (!deletedContact) {
            return res.status(404).json({ message: "Public contact not found" });
        }
        res.status(200).json({ message: "Public contact deleted successfully" });

    } catch (err) {
        console.error("Error deleting public contact:", err);
        res.status(500).json({ error: "Server error" });
    }
};


export const getAllPatientContacts = async (req, res) => {
    try {
        const contacts = await Contact.find()
            .populate("user", "name email phone") 
            .sort({ createdAt: -1 });
        res.status(200).json({ contacts });

    } catch (err) {
        console.error("Error fetching patient contacts:", err);
        res.status(500).json({ error: "Server error" });
    }
};


export const deletePatientContact = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedContact = await Contact.findByIdAndDelete(id);
        if (!deletedContact) {
            return res.status(404).json({ message: "Patient contact not found" });
        }
        res.status(200).json({ message: "Patient contact deleted successfully" });
        
    } catch (err) {
        console.error("Error deleting patient contact:", err);
        res.status(500).json({ error: "Server error" });
    }
};