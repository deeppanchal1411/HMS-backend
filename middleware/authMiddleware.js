import jwt from "jsonwebtoken";

const authenticate = async (req, res, next) => {

    const token = req.header("Authorization")?.split(" ")[1];  

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.loggedInUser = decoded;
        next();

    } catch (err) {
        console.log("Jwt verification failed", err);
        res.status(401).json({ error: "Invalid token" });
    }
};

const isAdmin = (req, res, next) => {
    if (req.loggedInUser?.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Admins only" });
    }
    next();
};
 
export { authenticate, isAdmin };