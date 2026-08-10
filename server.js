require("dotenv").config();

const app = require("./SRC/app.js");
const connectDB = require("./CONFIG/db.js");
const cors = require("cors");
const app = express();

app.use(cors());
const PORT = process.env.PORT || 5001;

console.log("ENV PORT:", process.env.PORT);
console.log("SERVER PORT:", PORT);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`MealEats server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();