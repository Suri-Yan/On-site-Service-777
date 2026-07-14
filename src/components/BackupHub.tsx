import React, { useState } from "react";
import {
  Shield,
  Download,
  Upload,
  User,
  Users,
  CheckCircle,
  AlertTriangle,
  Lock,
  RefreshCw,
  Eye,
} from "lucide-react";
import { UserRole } from "../types";

interface BackupHubProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onExportBackup: () => void;
  onImportBackup: (payload: string) => Promise<boolean>;
  logs: any[];
}

export default function BackupHub({
  currentRole,
  onChangeRole,
  onExportBackup,
  onImportBackup,
  logs,
}: BackupHubProps) {
  const [importText, setImportText] = useState("");
  const [restoring, setRestoring] = useState(false);

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole === "Technician") {
      alert("⚠️ ช่างเทคนิคไม่มีสิทธิ์ในการแก้ไขหรือกู้คืนฐานข้อมูลสำรอง!");
      return;
    }

    if (!importText.trim()) {
      alert("กรุณาวางรหัสข้อมูลสำรองที่ต้องการกู้คืน");
      return;
    }

    const confirmed = window.confirm(
      "⚠️ การกู้คืนข้อมูลจะทับซ้อนและเขียนทับฐานข้อมูลปัจจุบันทั้งหมด! คุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ?"
    );
    if (!confirmed) return;

    setRestoring(true);
    const success = await onImportBackup(importText.trim());
    setRestoring(false);

    if (success) {
      alert("🎉 กู้คืนฐานข้อมูลสำรองเข้ารหัสสำเร็จเรียบร้อยแล้ว!");
      setImportText("");
    } else {
      alert("❌ ไม่สามารถกู้คืนข้อมูลได้ กรุณาตรวจสอบความถูกต้องของรหัสข้อความสำรอง");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">ความปลอดภัยและระบบสำรองข้อมูล (Security Hub)</h2>
        <p className="text-xs text-slate-500">
          ตั้งค่าสิทธิ์ผู้ใช้งาน สลับบทบาทเพื่อทดสอบความปลอดภัย และกู้คืนข้อมูลสำรองขององค์กรแบบเข้ารหัส
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Role Simulator and access rights */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-800 border-b border-slate-100 pb-2 text-sm">
            <Users className="w-4.5 h-4.5 text-blue-600" />
            <span>จำลองบทบาทผู้ใช้งาน (RBAC)</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            ระบบความปลอดภัยแบ่งตามบทบาทหน้าที่ (Role-Based Access Control)
            สลับบทบาทด้านล่างเพื่อทดสอบสิทธิ์การมองเห็นและการทำธุรกรรมลบข้อมูลทำลายสิทธิ์
          </p>

          <div className="space-y-2 pt-2">
            {([
              { role: "Admin", desc: "ผู้ดูแลระบบ (เข้าถึงได้ทุกเมนู, ลบใบงาน, กู้คืนสำรอง)" },
              { role: "Manager", desc: "ผู้จัดการ (วางแผนงาน, ออกรายงาน, ห้ามสำรองข้อมูลระบบ)" },
              { role: "Technician", desc: "ช่างหน้างาน (สแกนอุปกรณ์หน้างาน, ดูตารางนัดหมาย, ไม่มีสิทธิ์ลบ)" },
            ] as const).map((r) => (
              <button
                key={r.role}
                onClick={() => onChangeRole(r.role)}
                className={`w-full p-3 rounded-lg border text-left transition cursor-pointer ${
                  currentRole === r.role
                    ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <User className="w-3.5 h-3.5" />
                  บทบาท: {r.role === "Admin" ? "แอดมิน" : r.role === "Manager" ? "ผู้จัดการ" : "ช่างหน้างาน"}
                </div>
                <p className="text-[10px] opacity-80 mt-1 leading-normal">{r.desc}</p>
              </button>
            ))}
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2.5 text-[11px] text-slate-500 font-medium">
            <Shield className="w-4 h-4 text-blue-500 shrink-0" />
            <span>สิทธิ์ปัจจุบัน: ปลดล็อกเมนูช่าง {currentRole !== "Technician" ? "และหลังบ้านเรียบร้อย" : ""}</span>
          </div>
        </div>

        {/* Right Columns: Encrypted Database Backup & System Audit Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Encrypted Backup Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <Lock className="w-4.5 h-4.5 text-blue-600" />
                <span>สำรองและกู้คืนเข้ารหัส (Base64 Encryption)</span>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                สถานะ: เปิดใช้งาน
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              ข้อมูลอุปกรณ์ ประวัติติดตั้ง และข้อมูลลูกค้าจะถูกสำรองโดยการเข้ารหัส Base64
              อย่างสมบูรณ์เพื่อความปลอดภัยของฐานข้อมูลองค์กร
            </p>

            <div className="flex gap-3">
              <button
                onClick={onExportBackup}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> สำรองข้อมูลทันที (Export)
              </button>
            </div>

            {/* Import form */}
            <form onSubmit={handleImportSubmit} className="space-y-2.5 pt-2">
              <label className="block text-xs font-bold text-slate-700">กู้คืนฐานข้อมูลผ่านรหัสสำรอง</label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                disabled={currentRole === "Technician"}
                placeholder={
                  currentRole === "Technician"
                    ? "⚠️ บทบาทช่างหน้างานไม่มีสิทธิ์เข้าใช้งานช่องกู้คืนฐานข้อมูล"
                    : "วางรหัสข้อความสำรองของคุณที่นี่เพื่อกู้คืนระบบทั้งหมด..."
                }
                rows={3}
                className="w-full p-3 text-xs rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-blue-500 bg-slate-50/50 disabled:opacity-50"
              ></textarea>

              {currentRole === "Technician" && (
                <div className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> เฉพาะแอดมินหรือผู้จัดการเท่านั้นที่สามารถเขียนทับฐานข้อมูลได้
                </div>
              )}

              <button
                type="submit"
                disabled={currentRole === "Technician" || restoring}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {restoring ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                กู้คืนข้อมูลเดี๋ยวนี้ (Restore Database)
              </button>
            </form>
          </div>

          {/* Audit log feeds */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-xs text-slate-800">บันทึกประวัติการทำธุรกรรมระบบ (Audit Logs)</span>
              <span className="font-mono text-[9px] text-slate-400">เรียลไทม์บันทึก</span>
            </div>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">ไม่มีประวัติการทำธุรกรรม</p>
              ) : (
                logs
                  .slice()
                  .reverse()
                  .map((log) => (
                    <div key={log.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[10px] space-y-1">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>{log.action}</span>
                        <span className="font-mono text-[9px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-500">
                        <span className="font-semibold text-slate-600">ผู้ทำรายการ:</span> {log.user} (
                        {log.details})
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
