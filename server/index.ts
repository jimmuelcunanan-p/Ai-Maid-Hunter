import "dotenv/config";
import { createApp, prisma } from "./app.js";
import { z } from "zod";
z.object({DATABASE_URL:z.string().default("file:./dev.db"),SESSION_SECRET:z.string().min(16).default("local-development-secret-change-this"),PORT:z.coerce.number().default(3001)}).parse(process.env);
const port=Number(process.env.PORT||3001);
createApp().listen(port,()=>console.log(`AI Maid Hunter API listening on http://localhost:${port}`));
process.on("SIGINT",async()=>{await prisma.$disconnect();process.exit()});
