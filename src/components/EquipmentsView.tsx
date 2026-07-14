import React, { useState } from "react";
import {
  Search,
  Tag,
  User,
  Calendar,
  Layers,
  MapPin,
  Clock,
  Shield,
  FileText,
  Camera,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Printer,
} from "lucide-react";
import { Equipment, Job } from "../types";
import PrintSticker from "./PrintSticker";

const getJobTypeLabel = (type: Job["jobType"]) => {
  switch (type) {
    case "Installation":
      return "ติดตั้งอุปกรณ์";
    case "Repair":
      return "ซ่อมแซม";
    case "Maintenance":
      return "บำรุงรักษา";
    case "Emergency":
      return "ด่วนที่สุด";
    default:
      return type;
  }
};

interface EquipmentsViewProps {
  equipments: Equipment[];
  jobs: Job[];
  onSearchQuery?: string;
  onClearSearchQuery?: () => void;
}

export default function EquipmentsView({
  equipments,
  jobs,
  onSearchQuery = "",
  onClearSearchQuery,
}: EquipmentsViewProps) {
  const [searchTerm, setSearchTerm] = useState(onSearchQuery);
  const [selectedSn, setSelectedSn] = useState<string | null>(null);
  const [showStickerPrint, setShowStickerPrint] = useState(false);

  // Sync external search query
  React.useEffect(() => {
    if (onSearchQuery) {
      setSearchTerm(onSearchQuery);
      // Automatically select the single matched item if searched
      const matches = equipments.filter(
        (eq) => eq.serialNumber.toLowerCase() === onSearchQuery.toLowerCase()
      );
      if (matches.length === 1) {
        setSelectedSn(matches[0].serialNumber);
      }
    }
  }, [onSearchQuery, equipments]);

  const handleClearSearch = () => {
    setSearchTerm("");
    if (onClearSearchQuery) onClearSearchQuery();
  };

  // Searching logic based on requirement (Serial Number, Model, MAC Address, Customer Name)
  const filteredEquipments = equipments.filter((eq) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      eq.serialNumber.toLowerCase().includes(q) ||
      eq.model.toLowerCase().includes(q) ||
      (eq.brand && eq.brand.toLowerCase().includes(q)) ||
      (eq.macAddress && eq.macAddress.toLowerCase().includes(q)) ||
      (eq.customerName && eq.customerName.toLowerCase().includes(q))
    );
  });

  const activeEq = equipments.find((e) => e.serialNumber === selectedSn) || null;

  // Derive Lifecycle History from Jobs
  const getEquipmentHistory = (serial: string) => {
    // Find all jobs containing this serial number
    const relatedJobs = jobs.filter((job) => job.equipmentSerials.includes(serial));
    // Sort related jobs by date
    return relatedJobs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getWarrantyProgress = (eq: Equipment) => {
    if (!eq.warrantyStart || !eq.warrantyEnd) return { pct: 0, daysLeft: 0, status: "No Warranty" };
    const start = new Date(eq.warrantyStart).getTime();
    const end = new Date(eq.warrantyEnd).getTime();
    const now = Date.now();

    if (now > end) return { pct: 100, daysLeft: 0, status: "Expired (หมดประกัน)" };
    const total = end - start;
    const elapsed = now - start;
    const pct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return { pct, daysLeft, status: `Active (${daysLeft} วันเหลืออยู่)` };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">ฐานข้อมูลอุปกรณ์และประกัน (Hardware Ledger)</h2>
          <p className="text-xs text-slate-500">
            สืบค้นข้อมูลผลิตภัณฑ์ ประวัติการติดตั้ง งานบำรุงรักษา ตลอดจนรูปภาพที่เชื่อมโยงกับ Serial Number
          </p>
        </div>
      </div>

      {/* Lookup Bar */}
      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหาด่วนด้วย S/N, ชื่อรุ่น, MAC Address หรือชื่อลูกค้า..."
          className="w-full pl-11 pr-16 py-3 bg-white border border-slate-200 focus:outline-none focus:border-blue-500 rounded-xl shadow-xs text-sm"
        />
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className="absolute right-4 top-3.5 text-xs text-slate-400 hover:text-slate-700 font-semibold cursor-pointer"
          >
            ล้างคำค้น
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Equipment list lookup results */}
        <div className="lg:col-span-1 space-y-3 max-h-[640px] overflow-y-auto pr-1">
          {filteredEquipments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
              <h4 className="font-bold text-slate-700 text-sm mb-1">ไม่พบอุปกรณ์ที่สืบค้น</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                ไม่พบข้อมูลที่ตรงกับคำค้นหา ลองตรวจสอบความถูกต้องของรหัส S/N หรือชื่อรุ่นอีกครั้ง
              </p>
            </div>
          ) : (
            filteredEquipments.map((eq) => {
              const history = getEquipmentHistory(eq.serialNumber);
              const warranty = getWarrantyProgress(eq);
              return (
                <div
                  key={eq.serialNumber}
                  onClick={() => {
                    setSelectedSn(eq.serialNumber);
                    setShowStickerPrint(false);
                  }}
                  className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                    selectedSn === eq.serialNumber
                      ? "bg-slate-900 border-slate-900 text-white shadow-md"
                      : "bg-white border-slate-200 hover:border-slate-350 text-slate-700 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">
                      {eq.brand}
                    </span>
                    <span className="text-[9px] font-mono opacity-40">INSTALLED</span>
                  </div>

                  <h3 className="font-bold text-sm line-clamp-1">{eq.model}</h3>
                  <div className={`font-mono text-xs font-bold mt-1 ${selectedSn === eq.serialNumber ? "text-blue-400" : "text-blue-600"}`}>S/N: {eq.serialNumber}</div>

                  {eq.customerName && (
                    <div className="flex items-center gap-1.5 text-xs opacity-80 mt-3 font-medium">
                      <User className="w-3.5 h-3.5" />
                      <span className="line-clamp-1">{eq.customerName}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-2 border-t border-dashed border-current/10 text-xs">
                    <span className="opacity-80">ซ่อม/ติดตั้ง {history.length} ครั้ง</span>
                    <span
                      className={`font-semibold text-[10px] px-2 py-0.5 rounded ${
                        warranty.daysLeft > 0
                          ? selectedSn === eq.serialNumber
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {warranty.daysLeft > 0 ? `ประกันอีก ${warranty.daysLeft} วัน` : "หมดประกัน"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Complete Lifecycle History & timelines */}
        <div className="lg:col-span-2">
          {activeEq ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {activeEq.brand}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{activeEq.model}</h3>
                  <div className="font-mono text-sm font-bold text-blue-600 mt-1">S/N: {activeEq.serialNumber}</div>
                </div>

                <button
                  onClick={() => setShowStickerPrint(!showStickerPrint)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {showStickerPrint ? "ดูประวัติอุปกรณ์" : "พิมพ์สติ๊กเกอร์ QR"}
                </button>
              </div>

              {/* Show Sticker Tool if toggled */}
              {showStickerPrint ? (
                <div className="animate-fade-in">
                  <PrintSticker equipment={activeEq} />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Metadata Specification Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="font-bold text-xs text-slate-700">รายละเอียดทางเทคนิค</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">MAC Address:</span>
                          <span className="font-mono text-slate-800 font-semibold">{activeEq.macAddress || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">IMEI Code:</span>
                          <span className="font-mono text-slate-800 font-semibold">{activeEq.imei || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">สถานที่ติดตั้ง:</span>
                          <span className="text-slate-800 font-semibold">{activeEq.location || "-"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-blue-600" /> ประกันอุปกรณ์
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">เริ่มประกัน:</span>
                          <span className="text-slate-800 font-semibold">{activeEq.warrantyStart || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">หมดอายุประกัน:</span>
                          <span className="text-slate-800 font-semibold">{activeEq.warrantyEnd || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">สถานะ:</span>
                          <span className="text-slate-800 font-semibold">{getWarrantyProgress(activeEq).status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {activeEq.notes && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600">
                      <span className="font-bold text-slate-700 block mb-1">บันทึกเพิ่มเติม:</span>
                      {activeEq.notes}
                    </div>
                  )}

                  {/* Attachment Images */}
                  {activeEq.photos && activeEq.photos.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" /> รูปถ่ายระหว่างปฏิบัติงาน ({activeEq.photos.length})
                      </h4>
                      <div className="flex gap-3 overflow-x-auto pb-1">
                        {activeEq.photos.map((base64, idx) => (
                          <div
                            key={idx}
                            className="w-32 h-24 rounded-xl overflow-hidden border border-slate-200 shrink-0 relative group"
                          >
                            <img src={base64} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                            <a
                              href={base64}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-medium transition"
                            >
                              เปิดดูภาพใหญ่
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lifecycle Timelines */}
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" /> Timeline ประวัติอุปกรณ์และซ่อมบำรุง
                    </h4>

                    {getEquipmentHistory(activeEq.serialNumber).length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        ยังไม่มีประวัติงานบันทึกสำหรับอุปกรณ์ชิ้นนี้
                      </p>
                    ) : (
                      <div className="relative border-l border-slate-200 ml-2.5 pl-5 space-y-6">
                        {getEquipmentHistory(activeEq.serialNumber).map((job) => (
                          <div key={job.id} className="relative">
                            {/* Dot icon */}
                            <span className="absolute -left-7.5 top-1.5 w-5 h-5 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center z-10">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            </span>

                            <div className="space-y-1">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                  {getJobTypeLabel(job.jobType)} (เลขที่: {job.id})
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                  {job.date}
                                </span>
                              </div>

                              <div className="text-xs text-slate-500 space-y-1">
                                <div>
                                  <span className="font-medium">ลูกค้า:</span> {job.customerName}
                                </div>
                                {job.notes && (
                                  <div>
                                    <span className="font-medium">การทำงาน:</span> {job.notes}
                                  </div>
                                )}
                                <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mt-1">
                                  <User className="w-3 h-3" /> ช่างผู้ติดตั้ง: {job.technicianName || "วิชัย ช่างเทคนิค"}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 text-center p-6">
              <Layers className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 mb-1">เลือกอุปกรณ์เพื่อดูประวัติ</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                กดเลือกอุปกรณ์จากรายชื่อด้านซ้าย หรือค้นหาข้อมูลเพื่อดูประวัติการติดตั้งประวัติซ่อม ช่างผู้คุมงาน และสติ๊กเกอร์ QR Code
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
