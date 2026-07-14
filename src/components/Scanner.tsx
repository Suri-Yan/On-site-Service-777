import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { Camera, RefreshCw, AlertTriangle, CheckCircle, Search, Upload, Plus } from "lucide-react";
import { Equipment } from "../types";

interface ScannerProps {
  onScanSuccess: (equipment: Equipment) => void;
  existingSerials: string[];
  allEquipments: Equipment[];
  onSearchHistory: (serial: string) => void;
}

export default function Scanner({
  onScanSuccess,
  existingSerials,
  allEquipments,
  onSearchHistory,
}: ScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState(false);

  // Parsed Form fields
  const [category, setCategory] = useState("Camera");
  const [brand, setBrand] = useState("Dahua");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [mac, setMac] = useState("");
  const [imei, setImei] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [firmwareVersion, setFirmwareVersion] = useState("");
  const [warrantyEnd, setWarrantyEnd] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");

  const getBrandSuggestions = (cat: string): string[] => {
    switch (cat) {
      case "Camera":
      case "NVR":
      case "DVR":
        return ["Dahua", "Hikvision", "UNV", "HiLook", "EZVIZ", "IMOU", "TP-Link VIGI", "Axis", "Hanwha", "Bosch", "Panasonic", "CP Plus", "Avtech", "Provision"];
      case "Router":
      case "Access Point":
      case "ONU":
        return ["MikroTik", "TP-Link", "Cisco", "Huawei", "Ruijie", "Ubiquiti", "DrayTek", "Zyxel"];
      case "PoE Switch":
      case "Switch":
        return ["Ruijie", "TP-Link", "Dahua", "Hikvision", "Cisco", "Planet", "Ubiquiti"];
      default:
        return ["Other", "Kingcom"];
    }
  };

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const SCANNER_ID = "camera-scanner-view";

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setIsScanning(true);
    setScanResult(null);
    setManualInput(false);

    // Wait a brief tick for the DOM element to mount
    setTimeout(async () => {
      try {
        const html5Qrcode = new Html5Qrcode(SCANNER_ID);
        scannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const minVal = Math.min(width, height);
              return { width: Math.floor(minVal * 0.7), height: Math.floor(minVal * 0.7) };
            },
          },
          (decodedText) => {
            // Success!
            playBeep();
            handleDecodedText(decodedText);
            stopScanner();
          },
          () => {
            // Silence scanner errors as it scans frame by frame
          }
        );
      } catch (err) {
        console.error("Failed to start camera scanner:", err);
        alert("ไม่สามารถเข้าถึงกล้องได้ กรุณาเปิดสิทธิ์การใช้งานกล้อง");
        setIsScanning(false);
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
    setIsScanning(false);
  };

  const playBeep = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.value = 1000;
      gain.gain.setValueAtTime(0.3, context.currentTime);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.15);
    } catch (e) {
      // Browser blocks audio context until user interaction, ignore if blocked
    }
  };

  // Automatically parsed decoded text (supporting local parsing + AI fallback)
  const handleDecodedText = async (text: string) => {
    setScanResult(text);
    setIsParsing(true);

    // Reset fields
    setBrand("");
    setModel("");
    setSerial("");
    setMac("");
    setImei("");

    // 1. Local parsing attempts (JSON or standard S/N patterns)
    try {
      const data = JSON.parse(text);
      if (data.serialNumber || data.sn || data.s_n || data.serial) {
        setBrand(data.brand || data.Brand || "");
        setModel(data.model || data.Model || "");
        setSerial(data.serialNumber || data.sn || data.s_n || data.serial || "");
        setMac(data.macAddress || data.mac || data.MAC || "");
        setImei(data.imei || data.IMEI || "");
        setIsParsing(false);
        return;
      }
    } catch (e) {
      // Not JSON
    }

    // Try key-value splitting (e.g. SN:1234,MAC:AB:CD)
    const kvPattern = /(?:s\/n|sn|serial|mac|imei|model|brand)\s*[:=]\s*([^\s,;]+)/gi;
    let match;
    let hasMatches = false;
    while ((match = kvPattern.exec(text)) !== null) {
      hasMatches = true;
      const term = match[0].toLowerCase();
      const val = match[1];
      if (term.includes("sn") || term.includes("serial")) setSerial(val);
      else if (term.includes("mac")) setMac(val);
      else if (term.includes("imei")) setImei(val);
      else if (term.includes("model")) setModel(val);
      else if (term.includes("brand")) setBrand(val);
    }

    if (hasMatches) {
      setIsParsing(false);
      return;
    }

    // 2. AI Parsing of unstructured barcode/labels
    try {
      const res = await fetch("/api/parse-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text }),
      });
      if (res.ok) {
        const result = await res.json();
        setBrand(result.brand || "");
        setModel(result.model || "");
        setSerial(result.serialNumber || text);
        setMac(result.macAddress || "");
        setImei(result.imei || "");
      } else {
        setSerial(text); // Default raw string as serial
      }
    } catch (err) {
      console.error("AI Parse failed, using fallback:", err);
      setSerial(text);
    } finally {
      setIsParsing(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serial.trim()) {
      alert("กรุณากรอกหรือสแกน Serial Number");
      return;
    }

    const newEquipment: Equipment = {
      brand: brand.trim() || "Unknown",
      model: model.trim() || "Unknown",
      serialNumber: serial.trim(),
      macAddress: mac.trim() || undefined,
      imei: imei.trim() || undefined,
      ipAddress: ipAddress.trim() || undefined,
      username: username.trim() || undefined,
      password: password.trim() || undefined,
      firmwareVersion: firmwareVersion.trim() || undefined,
      category: category as any,
      installationDate: new Date().toISOString().split("T")[0],
      warrantyStart: new Date().toISOString().split("T")[0],
      warrantyEnd: warrantyEnd || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: notes.trim() || undefined,
      photos: photo ? [photo] : [],
    };

    onScanSuccess(newEquipment);

    // Reset form
    setScanResult(null);
    setPhoto(null);
    setBrand("Dahua");
    setModel("");
    setSerial("");
    setMac("");
    setImei("");
    setIpAddress("");
    setUsername("admin");
    setPassword("");
    setFirmwareVersion("");
    setNotes("");
  };

  // Check if serial already exists in global database
  const isExistingInDb = allEquipments.some(
    (eq) => eq.serialNumber.toLowerCase() === serial.toLowerCase() && serial.trim() !== ""
  );

  return (
    <div id="equipment-scanner-card" className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-900 text-base">เครื่องสแกนเนอร์อุปกรณ์</h3>
          <p className="text-xs text-slate-500">สแกน QR Code / Barcode (Code128, Code39, Data Matrix)</p>
        </div>
        <button
          onClick={() => {
            if (manualInput) {
              setManualInput(false);
              setScanResult(null);
            } else {
              setManualInput(true);
              stopScanner();
              setScanResult("MANUAL_ENTRY");
            }
          }}
          className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
        >
          {manualInput ? "เปิดกล้องสแกน" : "เพิ่มข้อมูลเอง"}
        </button>
      </div>

      <div className="p-6">
        {/* Scanner stage */}
        {!scanResult && !manualInput && (
          <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            {isScanning ? (
              <div className="w-full max-w-sm flex flex-col items-center">
                <div
                  id={SCANNER_ID}
                  className="w-full aspect-square bg-black rounded-lg overflow-hidden border-2 border-blue-500 shadow-xs"
                ></div>
                <button
                  onClick={stopScanner}
                  className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 animate-spin" /> ปิดกล้องสแกน
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-700 text-sm mb-1">เริ่มทำงานด้วยกล้องอุปกรณ์</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
                  กดปุ่มด้านล่างเพื่ออนุญาตเข้าถึงกล้องและเริ่มสแกนฉลากอุปกรณ์ทันที
                </p>
                <button
                  onClick={startScanner}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <Camera className="w-4 h-4" /> เปิดกล้องสแกนทันที
                </button>
              </div>
            )}
          </div>
        )}

        {/* Scanning status / Loading Parser */}
        {isParsing && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-bold text-slate-700 animate-pulse">กำลังวิเคราะห์ข้อมูลด้วย AI...</p>
            <p className="text-xs text-slate-400">ค้นหายี่ห้อ รุ่น และรหัสฮาร์ดแวร์โดยละเอียด</p>
          </div>
        )}

        {/* Scan confirm Form */}
        {scanResult && !isParsing && (
          <form onSubmit={handleConfirmSubmit} className="space-y-4">
            {isExistingInDb && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">ตรวจพบข้อมูลในคลังแล้ว!</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    รหัส S/N: <span className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">{serial}</span> มีประวัติการติดตั้งอยู่แล้วในฐานข้อมูล
                  </p>
                  <button
                    type="button"
                    onClick={() => onSearchHistory(serial)}
                    className="text-xs font-bold underline text-amber-900 hover:text-black mt-2 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Search className="w-3 h-3" /> ค้นหาประวัติของอุปกรณ์ชิ้นนี้
                  </button>
                </div>
              </div>
            )}

            {!isExistingInDb && serial && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 flex items-center gap-2.5 text-xs font-bold">
                <CheckCircle className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
                <span>อุปกรณ์ชิ้นใหม่! จะถูกบันทึกลงในคลังอุปกรณ์หลังกดยืนยัน</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">หมวดหมู่อุปกรณ์ *</label>
                <select
                  required
                  value={category}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setCategory(cat);
                    // Pre-select first brand from suggestions
                    const suggestions = getBrandSuggestions(cat);
                    if (suggestions.length > 0) {
                      setBrand(suggestions[0]);
                    }
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                >
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  <option value="Camera">Camera (กล้องวงจรปิด)</option>
                  <option value="NVR">NVR (เครื่องบันทึก NVR)</option>
                  <option value="DVR">DVR (เครื่องบันทึก DVR)</option>
                  <option value="HDD">HDD (ฮาร์ดดิสก์)</option>
                  <option value="PoE Switch">PoE Switch (สวิตช์จ่ายไฟ)</option>
                  <option value="Switch">Switch (เน็ตเวิร์กสวิตช์)</option>
                  <option value="Router">Router (เร้าเตอร์)</option>
                  <option value="ONU">ONU (ตัวแปลงไฟเบอร์)</option>
                  <option value="Access Point">Access Point (จุดกระจายไวไฟ)</option>
                  <option value="UPS">UPS (เครื่องสำรองไฟ)</option>
                  <option value="Rack">Rack (ตู้แร็ค)</option>
                  <option value="Patch Panel">Patch Panel (แผงกระจายสาย)</option>
                  <option value="สาย LAN">สาย LAN (สายเน็ตเวิร์ก)</option>
                  <option value="Fiber">Fiber (สายไฟเบอร์ออปติก)</option>
                  <option value="Connector">Connector (หัวต่ออุปกรณ์)</option>
                  <option value="Power Supply">Power Supply (แหล่งจ่ายไฟ)</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ยี่ห้อ (Brand) *</label>
                <div className="flex gap-2">
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="flex-1 px-2 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                  >
                    {getBrandSuggestions(category).map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="อื่นๆ">อื่นๆ (พิมพ์เองด้านล่าง)</option>
                  </select>
                </div>
                {brand === "อื่นๆ" && (
                  <input
                    type="text"
                    required
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="พิมพ์ยี่ห้อเอง..."
                    className="w-full mt-2 px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">รุ่น (Model) *</label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="เช่น hAP ac3, U6-Lite"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Serial Number (S/N) *</label>
                <input
                  type="text"
                  required
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  placeholder="กรอกหรือสแกน Serial Number"
                  className="w-full px-3.5 py-2 font-mono text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">MAC Address</label>
                <input
                  type="text"
                  value={mac}
                  onChange={(e) => setMac(e.target.value)}
                  placeholder="เช่น AA:BB:CC:11:22:33"
                  className="w-full px-3.5 py-2 font-mono text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">IP Address ของเครื่อง</label>
                <input
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="เช่น 192.168.1.10"
                  className="w-full px-3.5 py-2 font-mono text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="รหัสผ่านเข้าเครื่อง"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Version Firmware</label>
                <input
                  type="text"
                  value={firmwareVersion}
                  onChange={(e) => setFirmwareVersion(e.target.value)}
                  placeholder="v1.2.3"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">รหัส IMEI (ถ้ามี)</label>
                <input
                  type="text"
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  placeholder="รหัส IMEI 15 หลัก"
                  className="w-full px-3.5 py-2 font-mono text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ประกันสิ้นสุด (หมดประกัน) *</label>
                <input
                  type="date"
                  required
                  value={warrantyEnd}
                  onChange={(e) => setWarrantyEnd(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ถ่ายรูปภาพอุปกรณ์เพิ่มเติม</label>
              <div className="flex gap-4 items-center">
                <label className="flex flex-col items-center justify-center w-28 h-20 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition bg-white">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-[10px] text-slate-500 mt-1 font-semibold">อัปโหลดรูปภาพ</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {photo && (
                  <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                    <img src={photo} alt="Device attachment" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-medium transition cursor-pointer"
                    >
                      ลบรูป
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">หมายเหตุเพิ่มเติม</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น การตั้งค่าเพิ่มเติม, อุปกรณ์เสริมที่ติดตั้ง"
                rows={2}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 resize-none bg-white text-slate-800"
              ></textarea>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setScanResult(null);
                  setManualInput(false);
                }}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> บันทึกลงใบงาน
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
