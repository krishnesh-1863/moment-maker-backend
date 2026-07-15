require("dotenv").config();

const express = require("express");
const multer = require("multer");
const rateLimit = require("express-rate-limit");

const { uploadFile, deleteFile } = require("./services/storage.service");
const postModel = require("./models/post.model");
const userModel = require("./models/user.model");

const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const cookieParser = require("cookie-parser");
const authMiddleware = require("./middlewares/auth.middleware");

const jwt = require("jsonwebtoken");

const app = express();

//rate-limiters

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many requests. Please try again later."
    }
});

const createPostLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 min
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "You can upload only 5 posts per minute."
    }
});

//middlewares

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(globalLimiter);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

/* ===================== MULTER ===================== */

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 2 * 1024 * 1024 // 2 MB
    },

    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"));
        }
    }
});


app.get("/", (req, res) => {
    res.send(" Moment Maker Backend is Running");
});
app.post(
    "/create-post",
    createPostLimiter,
    authMiddleware.auth,
    upload.single("image"),
    async (req, res) => {
        try {

            const result = await uploadFile(req.file.buffer);

            const post = await postModel.create({
                image: result.url,
                imageFileId: result.fileId,
                caption: req.body.caption,
                user: req.user._id
            });

            return res.status(201).json({
                message: "Post created successfully",
                post
            });

        } catch (err) {
            console.log(err);

            return res.status(500).json({
                message: err.message
            });
        }
    }
);


app.get("/posts", async (req, res) => {

    const posts = await postModel
        .find()
        .populate("user", "username");

    return res.status(200).json({
        message: "Posts fetched",
        posts
    });

});


app.delete("/posts/:id", authMiddleware.auth, async (req, res) => {

    try {

        const post = await postModel.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You are not allowed to delete this post"
            });
        }

        // Uncomment after ImageKit delete issue is fixed
        // await deleteFile(post.imageFileId);

        await postModel.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            message: "Post deleted successfully"
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: err.message
        });

    }

});



app.get("/me", async (req, res) => {

    try {

        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel
            .findById(decoded.id)
            .select("-password");

        return res.status(200).json({
            user
        });

    } catch (err) {

        return res.status(401).json({
            message: "Invalid Token"
        });

    }

});

module.exports = app;