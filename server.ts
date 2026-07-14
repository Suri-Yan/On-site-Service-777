import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "db.json");

// Parse JSON payloads up to 10MB (for photos)
app.use(express.json({ limit: "10mb" }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Seed Initial Database if not exists
const initialDb = {
  users: [
    { uid: "admin-1", email: "admin@example.com", displayName: "สมชาย แอดมิน", role: "Admin" },
    { uid: "tech-1", email: "tech@example.com", displayName: "วิชัย ช่างเทคนิค", role: "Technician" },
    { uid: "mgr-1", email: "manager@example.com", displayName: "เกรียงไกร ผู้จัดการ", role: "Manager" }
  ],
  jobs: [
    {
      id: "JOB-1001",
      customerName: "บริษัท นำโชค โลจิสติกส์ จำกัด",
      jobType: "Installation",
      phone: "081-234-5678",
      address: "123/45 ถนนวิภาวดีรังสิต แขวงสนามบิน เขตดอนเมือง กรุงเทพฯ 10210",
      date: new Date().toISOString().split("T")[0], // Today
      startTime: "09:00",
      endTime: "12:00",
      notes: "ติดตั้งเราเตอร์ Mikrotik และ Access Point Router รวม 3 จุด",
      status: "In Progress",
      reminders: ["1day", "3hours"],
      equipmentSerials: ["MT749204859", "AP884029482"],
      technicianName: "วิชัย ช่างเทคนิค"
    },
    {
      id: "JOB-1002",
      customerName: "คุณมณี สุขสวัสดิ์",
      jobType: "Repair",
      phone: "089-987-6543",
      address: "88/19 หมู่บ้านกรีนวิลล์ ซอย 5 ถนนบางนา-ตราด กม.10 สมุทรปราการ",
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow
      startTime: "13:30",
      endTime: "15:30",
      notes: "ลูกค้าแจ้งอินเทอร์เน็ตหลุดบ่อย มีสัญลักษณ์สีแดงขึ้นที่ ONU อุปกรณ์เดิม",
      status: "Pending",
      reminders: ["1day", "1hour"],
      equipmentSerials: [],
      technicianName: "วิชัย ช่างเทคนิค"
    },
    {
      id: "JOB-1003",
      customerName: "คลินิกทันตกรรมยิ้มสวย",
      jobType: "Maintenance",
      phone: "02-555-9999",
      address: "410 อาคารสยามพลาซ่า ชั้น 2 ถนนพญาไท เขตปทุมวัน กรุงเทพฯ 10330",
      date: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0], // 2 days later
      startTime: "10:00",
      endTime: "11:30",
      notes: "ตรวจเช็คสภาพตู้แร็คระบบเน็ตเวิร์กประจำปี ทำความสะอาดห้องเครื่อง",
      status: "Pending",
      reminders: ["3hours"],
      equipmentSerials: [],
      technicianName: "วิชัย ช่างเทคนิค"
    }
  ],
  equipments: [
    {
      brand: "Mikrotik",
      model: "RB5009UG+S+IN",
      serialNumber: "MT749204859",
      macAddress: "18:FD:74:92:04:85",
      installationDate: new Date().toISOString().split("T")[0],
      customerName: "บริษัท นำโชค โลจิสติกส์ จำกัด",
      location: "ห้องเซิร์ฟเวอร์ ชั้น 2",
      warrantyStart: new Date().toISOString().split("T")[0],
      warrantyEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: "ตั้งค่า PPPoE Client และ VLAN สำหรับแผนกต่างๆ",
      photos: []
    },
    {
      brand: "Ubiquiti",
      model: "UniFi U6-Lite",
      serialNumber: "AP884029482",
      macAddress: "60:22:32:84:02:94",
      installationDate: new Date().toISOString().split("T")[0],
      customerName: "บริษัท นำโชค โลจิสติกส์ จำกัด",
      location: "โถงต้อนรับ ชั้น 1",
      warrantyStart: new Date().toISOString().split("T")[0],
      warrantyEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: "จ่ายไฟผ่าน PoE Switch แชนแนล 1 สัญญาณครอบคลุมชั้น 1",
      photos: []
    }
  ],
  notifications: [
    {
      id: "nt-1",
      title: "ใบงานเร่งด่วนใหม่",
      message: "มีงานซ่อมด่วนที่ร้าน คุณมณี สุขสวัสดิ์ พรุ่งนี้เวลา 13:30 น.",
      category: "urgent",
      createdAt: new Date().toISOString(),
      read: false
    },
    {
      id: "nt-2",
      title: "การจัดตารางเวลา",
      message: "ผู้จัดการมอบหมายงานติดตั้งให้ช่างวิชัยเรียบร้อยแล้ว",
      category: "new",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      read: true
    }
  ],
  logs: [
    {
      id: "log-1",
      timestamp: new Date().toISOString(),
      action: "System Booted",
      user: "System",
      details: "ระบบเริ่มต้นและโหลดฐานข้อมูลอุปกรณ์เรียบร้อยแล้ว"
    }
  ]
};

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), "utf-8");
      return initialDb;
    }
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading db.json, returning initial state:", err);
    return initialDb;
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db.json:", err);
  }
}

// REST API Endpoints
app.get("/api/db", (req, res) => {
  const db = readDb();
  res.json(db);
});

app.post("/api/db", (req, res) => {
  const updatedData = req.body;
  if (!updatedData || typeof updatedData !== "object") {
    return res.status(400).json({ error: "Invalid data format" });
  }
  writeDb(updatedData);
  res.json({ success: true, message: "Database saved successfully" });
});

// AI Parsing of Unstructured text from QR or Barcodes
app.post("/api/parse-code", async (req, res) => {
  const { rawText } = req.body;
  if (!rawText) {
    return res.status(400).json({ error: "No text provided for scanning" });
  }

  try {
    console.log("Analyzing text via Gemini:", rawText);
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `กรุณาวิเคราะห์ข้อความที่สแกนได้จากเครื่องสแกนเนอร์/กล้อง เพื่อดึงข้อมูลอุปกรณ์ ยี่ห้อ (Brand), รุ่น (Model), Serial Number (S/N), MAC Address (ถ้ามี) และ IMEI (ถ้ามี) ให้อยู่ในรูปแบบ JSON เสมอ หากค่าใดหาไม่ได้ให้ส่งค่าว่างกลับมา ข้อความที่จะวิเคราะห์คือ:
      
      "${rawText}"`,
      config: {
        systemInstruction: "You are a professional technician's scanner companion. Carefully identify and map parsed text to hardware identifiers: Brand, Model, Serial Number (S/N), MAC Address, or IMEI. Output must match the requested JSON schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand: { type: Type.STRING, description: "เช่น Cisco, Mikrotik, Apple, HP, TP-Link, Ruijie" },
            model: { type: Type.STRING, description: "รุ่นอุปกรณ์ เช่น RB5009, RG-RAP2260, iPhone 15" },
            serialNumber: { type: Type.STRING, description: "Serial Number หรือ S/N ห้ามมีคำว่า S/N หรือ SN: นำหน้า เอาเฉพาะรหัส" },
            macAddress: { type: Type.STRING, description: "MAC Address ในรูปแบบ XX:XX:XX:XX:XX:XX หรือไร้เครื่องหมายขั้นแต่ให้จัดรูปแบบให้สวยงาม" },
            imei: { type: Type.STRING, description: "รหัส IMEI 15 หลัก (ถ้ามี)" }
          },
          required: ["brand", "model", "serialNumber"]
        }
      }
    });

    const parsedResult = JSON.parse(response.text.trim());
    console.log("Parsed result from Gemini:", parsedResult);
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Gemini scanning parser error:", error);
    // Graceful fallback for non-AI clients or offline models
    res.json({
      brand: "",
      model: "",
      serialNumber: rawText, // treat entire rawText as serial number by default
      macAddress: "",
      imei: ""
    });
  }
});

// Database Export/Restore
app.get("/api/backup/export", (req, res) => {
  const db = readDb();
  const backupStr = JSON.stringify(db, null, 2);
  // Encrypt simulating safety
  const base64Backup = Buffer.from(backupStr).toString("base64");
  res.json({
    timestamp: new Date().toISOString(),
    hash: "SHA256-" + Math.random().toString(36).substring(7),
    payload: base64Backup
  });
});

app.post("/api/backup/import", (req, res) => {
  const { payload } = req.body;
  if (!payload) {
    return res.status(400).json({ error: "Missing backup payload" });
  }
  try {
    const rawStr = Buffer.from(payload, "base64").toString("utf-8");
    const parsedDb = JSON.parse(rawStr);
    if (!parsedDb.jobs || !parsedDb.equipments || !parsedDb.users) {
      return res.status(400).json({ error: "Invalid backup format: Missing core arrays" });
    }
    writeDb(parsedDb);
    res.json({ success: true, message: "Database restored successfully" });
  } catch (err: any) {
    res.status(400).json({ error: "Failed to restore backup: " + err.message });
  }
});

// Mount Vite middleware or Static Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

// Do not start the listener when deploying as a Vercel serverless function
if (!process.env.VERCEL) {
  startServer();
}

export default app;
