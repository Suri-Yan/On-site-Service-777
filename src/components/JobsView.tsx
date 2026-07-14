import React, { useState } from "react";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle,
  User,
  Trash2,
  Share2,
  ExternalLink,
  Smartphone,
  Mail,
  Camera,
  Layers,
  FileText,
  AlertTriangle,
  Activity,
  Wifi,
  Check,
  RotateCcw,
  Printer,
  Image as ImageIcon,
  CheckSquare,
} from "lucide-react";
import { Job, Equipment } from "../types";
import Scanner from "./Scanner";
import PrintSticker from "./PrintSticker";

interface JobsViewProps {
  jobs: Job[];
  allEquipments: Equipment[];
  accessToken: string | null;
  currentUser: any;
  onUpdateJob: (updatedJob: Job) => void;
  onCreateJob: (newJob: Job) => void;
  onDeleteJob: (jobId: string) => void;
  onAddEquipmentToJob: (jobId: string, equipment: Equipment) => void;
  onSearchHistory: (serial: string) => void;
  selectedJobExternal?: Job | null;
  onClearSelectedJobExternal?: () => void;
}

export default function JobsView({
  jobs,
  allEquipments,
  accessToken,
  currentUser,
  onUpdateJob,
  onCreateJob,
  onDeleteJob,
  onAddEquipmentToJob,
  onSearchHistory,
  selectedJobExternal,
  onClearSelectedJobExternal,
}: JobsViewProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState<"All" | "Pending" | "In Progress" | "Completed" | "Canceled">("All");

  // Tabbed layout within Selected Job Drawer
  const [detailsTab, setDetailsTab] = useState<"equipments" | "checklist" | "testing" | "photos" | "signature" | "warranty" | "survey">("equipments");

  // Site Survey & Quotation states
  const [surveyDate, setSurveyDate] = useState("");
  const [surveyDistanceKm, setSurveyDistanceKm] = useState(0);
  const [cameraPointsEst, setCameraPointsEst] = useState(0);
  const [cableLengthEst, setCableLengthEst] = useState(0);
  const [powerPointsEst, setPowerPointsEst] = useState(0);
  const [environmentNotes, setEnvironmentNotes] = useState("");

  const [quotationNumber, setQuotationNumber] = useState("");
  const [quotationNotes, setQuotationNotes] = useState("");
  const [vatEnabled, setVatEnabled] = useState(false);
  const [quotationItems, setQuotationItems] = useState<{ name: string; quantity: number; pricePerUnit: number; total: number }[]>([]);

  // Warranty / Onsite Service states for Create Form
  const [enableWarranty, setEnableWarranty] = useState(true);
  const [warrantyTermYears, setWarrantyTermYears] = useState(1);
  const [freeServiceCount, setFreeServiceCount] = useState(3);

  // Claim Form state variables
  const [claimDate, setClaimDate] = useState("");
  const [claimTechnician, setClaimTechnician] = useState("");
  const [claimNotes, setClaimNotes] = useState("");
  const [showClaimForm, setShowClaimForm] = useState(false);

  // Checklist state variables (synchronized dynamically on selectedJobId change)
  const [checklistLan, setChecklistLan] = useState(false);
  const [checklistPoe, setChecklistPoe] = useState(false);
  const [checklistPower, setChecklistPower] = useState(false);
  const [checklistInternet, setChecklistInternet] = useState(false);
  const [checklistPing, setChecklistPing] = useState(false);
  const [checklistCamera, setChecklistCamera] = useState(false);
  const [checklistHdd, setChecklistHdd] = useState(false);
  const [checklistUps, setChecklistUps] = useState(false);
  const [checklistRouter, setChecklistRouter] = useState(false);
  const [checklistSwitch, setChecklistSwitch] = useState(false);
  const [checklistNotes, setChecklistNotes] = useState("");

  // System Testing simulation state variables
  const [pingIp, setPingIp] = useState("192.168.1.1");
  const [packetLoss, setPacketLoss] = useState("");
  const [latency, setLatency] = useState("");
  const [bwUpload, setBwUpload] = useState("");
  const [bwDownload, setBwDownload] = useState("");
  const [testNotes, setTestNotes] = useState("");
  const [isSimulatingTest, setIsSimulatingTest] = useState(false);

  // Drawing signature state variables
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // PDF report builder state variables
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<"handover" | "service" | "installation" | "pm">("handover");

  // Create Form State
  const [customerName, setCustomerName] = useState("");
  const [jobType, setJobType] = useState<Job["jobType"]>("SiteSurvey");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [reminders, setReminders] = useState<("1day" | "3hours" | "1hour" | "30min")[]>(["3hours"]);

  // Sticker print modal
  const [stickerTarget, setStickerTarget] = useState<Equipment | null>(null);

  // Sync Google Calendar process states
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  // Sync enableWarranty with jobType change in Creation Form
  React.useEffect(() => {
    setEnableWarranty(jobType === "Installation");
  }, [jobType]);

  // If a job was selected from another view (e.g. Dashboard)
  React.useEffect(() => {
    if (selectedJobExternal) {
      setSelectedJobId(selectedJobExternal.id);
      if (onClearSelectedJobExternal) onClearSelectedJobExternal();
    }
  }, [selectedJobExternal]);

  const activeJob = jobs.find((j) => j.id === selectedJobId) || null;

  // React effect to synchronize checklist and system test details when active job changes
  React.useEffect(() => {
    if (activeJob) {
      // Load onsite checklist fields
      const cl = activeJob.checklist;
      setChecklistLan(cl?.checkLan || false);
      setChecklistPoe(cl?.checkPoe || false);
      setChecklistPower(cl?.checkPower || false);
      setChecklistInternet(cl?.checkInternet || false);
      setChecklistPing(cl?.checkPing || false);
      setChecklistCamera(cl?.checkCamera || false);
      setChecklistHdd(cl?.checkHdd || false);
      setChecklistUps(cl?.checkUps || false);
      setChecklistRouter(cl?.checkRouter || false);
      setChecklistSwitch(cl?.checkSwitch || false);
      setChecklistNotes(cl?.resultNotes || "");

      // Load network system test fields
      const st = activeJob.systemTest;
      setPingIp(st?.pingIp || "192.168.1.1");
      setPacketLoss(st?.packetLoss || "");
      setLatency(st?.latency || "");
      setBwUpload(st?.bandwidthUpload || "");
      setBwDownload(st?.bandwidthDownload || "");
      setTestNotes(st?.resultNotes || "");

      // Load site survey details
      const sd = activeJob.surveyDetails;
      setSurveyDate(sd?.surveyDate || activeJob.date || "");
      setSurveyDistanceKm(sd?.surveyDistanceKm || 15);
      setCameraPointsEst(sd?.cameraPointsEst || 4);
      setCableLengthEst(sd?.cableLengthEst || 100);
      setPowerPointsEst(sd?.powerPointsEst || 2);
      setEnvironmentNotes(sd?.environmentNotes || "");

      // Load quotation details
      const qd = activeJob.quotationDetails;
      setQuotationNumber(qd?.quotationNumber || `QT-${activeJob.id}`);
      setQuotationNotes(qd?.notes || "ราคารวมบริการ onsite service ตรวจเช็คฟรี 3 ครั้ง ในรอบ 1 ปีหลังการติดตั้งเสร็จสิ้น");
      setVatEnabled(qd?.vatEnabled || false);
      setQuotationItems(qd?.items || [
        { name: "กล้อง CCTV ความละเอียดสูง HD IP Camera", quantity: 4, pricePerUnit: 2500, total: 10000 },
        { name: "สายสัญญาณสำเร็จรูปพร้อมหัวต่อ RJ45 Outdoor", quantity: 4, pricePerUnit: 350, total: 1400 },
        { name: "เครื่องบันทึกภาพ NVR 8CH พร้อม Harddisk 2TB", quantity: 1, pricePerUnit: 6500, total: 6500 },
        { name: "ค่าบริการติดตั้ง On-site Service ติดตั้ง+ประกัน 1 ปี", quantity: 1, pricePerUnit: 3500, total: 3500 },
      ]);

      // Set details default tab based on jobType
      if (activeJob.jobType === "SiteSurvey") {
        setDetailsTab("survey");
      } else {
        setDetailsTab("equipments");
      }

      // Reset Claim fields
      setClaimDate(new Date().toISOString().split("T")[0]);
      setClaimTechnician(currentUser?.displayName || "วิชัย ช่างเทคนิค");
      setClaimNotes("");
      setShowClaimForm(false);
    }
  }, [selectedJobId]);

  // Handles Google Calendar API Event creation
  const handleAddToGoogleCalendar = async (job: Job) => {
    if (!accessToken) {
      alert("กรุณาเข้าสู่ระบบ Google Account ก่อนเชื่อมโยงปฏิทิน");
      return;
    }

    const confirmed = window.confirm(
      `คุณต้องการเพิ่มกิจกรรมนัดหมายสำหรับลูกค้า "${job.customerName}" ลงใน Google Calendar ใช่หรือไม่?`
    );
    if (!confirmed) return;

    setIsSyncing(job.id);

    try {
      // Maps grounding / maps links construction
      const googleMapsQuery = encodeURIComponent(job.address);
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`;

      const payload = {
        summary: `[งาน${getJobTypeLabel(job.jobType)}] คุณ ${job.customerName}`,
        description: `ประเภทงาน: ${job.jobType}\nเบอร์โทร: ${job.phone}\nที่อยู่จัดส่ง/ติดตั้ง: ${job.address}\nลิงก์แผนที่นำทาง: ${googleMapsUrl}\n\nรายละเอียดใบงานเพิ่มเติม:\n${job.notes || "-"}\n\n*ระบบอัปเดตอัตโนมัติจาก Equipment Scanner & Job Manager`,
        location: job.address,
        start: {
          dateTime: `${job.date}T${job.startTime}:00`,
          timeZone: "Asia/Bangkok",
        },
        end: {
          dateTime: `${job.date}T${job.endTime}:00`,
          timeZone: "Asia/Bangkok",
        },
      };

      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const eventData = await res.json();
        const updatedJob = { ...job, googleCalendarEventId: eventData.id };
        onUpdateJob(updatedJob);
        alert("เพิ่มนัดหมายลง Google Calendar เรียบร้อยแล้ว!");
      } else {
        const errData = await res.json();
        console.error("Google Calendar Error:", errData);
        alert(`เกิดข้อผิดพลาดในการเชื่อมต่อปฏิทิน: ${errData.error?.message || "ไม่ทราบสาเหตุ"}`);
      }
    } catch (err: any) {
      console.error("Failed to add to Google Calendar:", err);
      alert("ไม่สามารถเชื่อมต่อปฏิทินได้: " + err.message);
    } finally {
      setIsSyncing(null);
    }
  };

  // Handles Auto-update Google Calendar Event details
  const handleUpdateGoogleCalendar = async (job: Job) => {
    if (!accessToken || !job.googleCalendarEventId) return;

    try {
      const googleMapsQuery = encodeURIComponent(job.address);
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`;

      const payload = {
        summary: `[งาน${getJobTypeLabel(job.jobType)}] คุณ ${job.customerName}`,
        description: `ประเภทงาน: ${job.jobType}\nเบอร์โทร: ${job.phone}\nที่อยู่จัดส่ง/ติดตั้ง: ${job.address}\nลิงก์แผนที่นำทาง: ${googleMapsUrl}\n\nรายละเอียดใบงานเพิ่มเติม:\n${job.notes || "-"}\n\n*อัปเดตอัตโนมัติจากการเปลี่ยนตารางนัดหมาย`,
        location: job.address,
        start: {
          dateTime: `${job.date}T${job.startTime}:00`,
          timeZone: "Asia/Bangkok",
        },
        end: {
          dateTime: `${job.date}T${job.endTime}:00`,
          timeZone: "Asia/Bangkok",
        },
      };

      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${job.googleCalendarEventId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      console.log("Auto-updated Google Calendar Event:", job.googleCalendarEventId);
    } catch (err) {
      console.error("Auto-update Google Calendar failed:", err);
    }
  };

  // Handles Google Calendar Event deletion (with confirmation dialog)
  const handleDeleteFromGoogleCalendar = async (job: Job, quiet = false) => {
    if (!accessToken || !job.googleCalendarEventId) return;

    if (!quiet) {
      const confirmed = window.confirm(
        `ระบบตรวจพบว่าใบงานนี้ลิงก์อยู่กับปฏิทิน Google Calendar คุณต้องการลบกิจกรรมนัดหมายนี้ออกจากปฏิทินด้วยหรือไม่?`
      );
      if (!confirmed) return;
    }

    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${job.googleCalendarEventId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (res.ok) {
        console.log("Deleted Google Calendar Event:", job.googleCalendarEventId);
        if (!quiet) alert("ลบกิจกรรมออกจาก Google Calendar เรียบร้อยแล้ว");
      }
    } catch (err) {
      console.error("Delete Calendar Event error:", err);
    }
  };

  // Save Checklist
  const handleSaveChecklist = () => {
    if (!activeJob) return;
    const updatedJob: Job = {
      ...activeJob,
      checklist: {
        checkLan: checklistLan,
        checkPoe: checklistPoe,
        checkPower: checklistPower,
        checkInternet: checklistInternet,
        checkPing: checklistPing,
        checkCamera: checklistCamera,
        checkHdd: checklistHdd,
        checkUps: checklistUps,
        checkRouter: checklistRouter,
        checkSwitch: checklistSwitch,
        resultNotes: checklistNotes,
      },
    };
    onUpdateJob(updatedJob);
    alert("บันทึกเช็คลิสต์ตรวจสอบหน้างานสำเร็จ!");
  };

  // Simulate System Test
  const handleSimulateSystemTest = () => {
    if (!activeJob) return;
    setIsSimulatingTest(true);
    
    // Simulate gradual packet loss, latency, and download/upload measurement
    setTimeout(() => {
      const simulatedLoss = Math.random() < 0.15 ? (Math.random() * 2).toFixed(1) + "%" : "0%";
      const simulatedLatency = (10 + Math.floor(Math.random() * 30)) + " ms";
      const simulatedUpload = (400 + Math.floor(Math.random() * 500)) + " Mbps";
      const simulatedDownload = (800 + Math.floor(Math.random() * 200)) + " Mbps";
      
      setPacketLoss(simulatedLoss);
      setLatency(simulatedLatency);
      setBwUpload(simulatedUpload);
      setBwDownload(simulatedDownload);
      setIsSimulatingTest(false);
      
      const updatedJob: Job = {
        ...activeJob,
        systemTest: {
          pingIp,
          packetLoss: simulatedLoss,
          latency: simulatedLatency,
          bandwidthUpload: simulatedUpload,
          bandwidthDownload: simulatedDownload,
          resultNotes: testNotes,
        },
      };
      onUpdateJob(updatedJob);
    }, 2000);
  };

  // Save manual/simulated network test details
  const handleSaveSystemTest = () => {
    if (!activeJob) return;
    const updatedJob: Job = {
      ...activeJob,
      systemTest: {
        pingIp,
        packetLoss,
        latency,
        bandwidthUpload: bwUpload,
        bandwidthDownload: bwDownload,
        resultNotes: testNotes,
      },
    };
    onUpdateJob(updatedJob);
    alert("บันทึกผลการทดสอบระบบเน็ตเวิร์กเรียบร้อย!");
  };

  // Signature Draw Helpers
  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";

    const rect = canvas.getBoundingClientRect();
    const isTouch = e.touches && e.touches.length > 0;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const isTouch = e.touches && e.touches.length > 0;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    const updatedJob: Job = { ...activeJob, signature: dataUrl };
    onUpdateJob(updatedJob);
    alert("บันทึกลายมือชื่อลูกค้ารับมอบงานสำเร็จ!");
  };

  // Handle Photo uploading folders (before, during, after)
  const handleJobPhotoUpload = (folder: "before" | "during" | "after", e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeJob) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const currentPhotos = activeJob.photos || { before: [], during: [], after: [] };
      const updatedFolder = [...(currentPhotos[folder] || []), base64];
      
      const updatedJob: Job = {
        ...activeJob,
        photos: {
          ...currentPhotos,
          [folder]: updatedFolder,
        },
      };
      onUpdateJob(updatedJob);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteJobPhoto = (folder: "before" | "during" | "after", index: number) => {
    if (!activeJob || !activeJob.photos) return;
    const currentPhotos = activeJob.photos;
    const updatedFolder = (currentPhotos[folder] || []).filter((_, idx) => idx !== index);

    const updatedJob: Job = {
      ...activeJob,
      photos: {
        ...currentPhotos,
        [folder]: updatedFolder,
      },
    };
    onUpdateJob(updatedJob);
  };

  const handleAddClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJob || !activeJob.warranty) return;
    if (!claimDate || !claimTechnician || !claimNotes) {
      alert("กรุณากรอกข้อมูลการเคลมบริการให้ครบถ้วน");
      return;
    }

    const newClaim = {
      id: "claim-" + Date.now(),
      date: claimDate,
      notes: claimNotes,
      technicianName: claimTechnician,
    };

    const updatedWarranty = {
      ...activeJob.warranty,
      usedFreeServices: activeJob.warranty.usedFreeServices + 1,
      claims: [...activeJob.warranty.claims, newClaim],
    };

    const updatedJob: Job = {
      ...activeJob,
      warranty: updatedWarranty,
    };

    onUpdateJob(updatedJob);
    alert("บันทึกการเคลมบริการฟรีสำเร็จเรียบร้อย!");
    setClaimNotes("");
    setShowClaimForm(false);
  };

  const handleDeleteClaim = (claimId: string) => {
    if (!activeJob || !activeJob.warranty) return;
    const confirmed = window.confirm("คุณต้องการลบประวัติการเคลมบริการนี้และคืนสิทธิ์คงเหลือ ใช่หรือไม่?");
    if (!confirmed) return;

    const filteredClaims = activeJob.warranty.claims.filter((c) => c.id !== claimId);
    const updatedWarranty = {
      ...activeJob.warranty,
      usedFreeServices: Math.max(0, activeJob.warranty.usedFreeServices - 1),
      claims: filteredClaims,
    };

    const updatedJob: Job = {
      ...activeJob,
      warranty: updatedWarranty,
    };

    onUpdateJob(updatedJob);
    alert("ลบประวัติการเคลมและคืนสิทธิ์เรียบร้อย");
  };

  const handleEnableWarrantyRetroactive = () => {
    if (!activeJob) return;
    const calculateEndDate = (start: string, years: number): string => {
      try {
        const d = new Date(start);
        d.setFullYear(d.getFullYear() + years);
        return d.toISOString().split("T")[0];
      } catch (err) {
        return start;
      }
    };

    const updatedJob: Job = {
      ...activeJob,
      warranty: {
        warrantyStartDate: activeJob.date,
        warrantyEndDate: calculateEndDate(activeJob.date, 1),
        totalFreeServices: 3,
        usedFreeServices: 0,
        claims: [],
      },
    };

    onUpdateJob(updatedJob);
    alert("เปิดใช้งานระบบรับประกันและสิทธิ์บริการฟรีสำเร็จ!");
  };

  const addQuotationItem = () => {
    setQuotationItems([
      ...quotationItems,
      { name: "รายการสินค้า / อุปกรณ์ หรือค่าบริการ", quantity: 1, pricePerUnit: 1000, total: 1000 }
    ]);
  };

  const removeQuotationItem = (index: number) => {
    setQuotationItems(quotationItems.filter((_, idx) => idx !== index));
  };

  const updateQuotationItem = (index: number, field: "name" | "quantity" | "pricePerUnit", value: any) => {
    const updated = [...quotationItems];
    if (field === "quantity" || field === "pricePerUnit") {
      updated[index][field] = Number(value);
      updated[index].total = updated[index].quantity * updated[index].pricePerUnit;
    } else {
      updated[index][field] = value;
    }
    setQuotationItems(updated);
  };

  const handleSaveSurveyAndQuotation = () => {
    if (!activeJob) return;

    const subTotal = quotationItems.reduce((acc, item) => acc + (item.quantity * item.pricePerUnit), 0);
    const tax = vatEnabled ? subTotal * 0.07 : 0;
    const grandTotal = subTotal + tax;

    const updatedJob: Job = {
      ...activeJob,
      surveyDetails: {
        surveyDate,
        surveyDistanceKm: Number(surveyDistanceKm),
        cameraPointsEst: Number(cameraPointsEst),
        cableLengthEst: Number(cableLengthEst),
        powerPointsEst: Number(powerPointsEst),
        environmentNotes,
        surveyPhotos: activeJob.surveyDetails?.surveyPhotos || [],
      },
      quotationDetails: {
        quotationNumber,
        items: quotationItems,
        totalPrice: subTotal,
        vatEnabled,
        grandTotal,
        notes: quotationNotes,
        status: activeJob.quotationDetails?.status || "Draft",
        sentDate: activeJob.quotationDetails?.sentDate || (activeJob.quotationDetails?.status === "PendingApproval" ? new Date().toISOString().split("T")[0] : undefined),
        approvedDate: activeJob.quotationDetails?.approvedDate,
      },
    };

    onUpdateJob(updatedJob);
    alert("บันทึกข้อมูลผลการสำรวจและรายละเอียดใบเสนอราคาเรียบร้อยแล้ว!");
  };

  const handleUpdateQuotationStatus = (newStatus: "Draft" | "PendingApproval" | "Approved" | "Rejected") => {
    if (!activeJob || !activeJob.quotationDetails) return;

    const updatedJob: Job = {
      ...activeJob,
      quotationDetails: {
        ...activeJob.quotationDetails,
        status: newStatus,
        sentDate: newStatus === "PendingApproval" ? new Date().toISOString().split("T")[0] : activeJob.quotationDetails.sentDate,
        approvedDate: newStatus === "Approved" ? new Date().toISOString().split("T")[0] : activeJob.quotationDetails.approvedDate,
      }
    };

    onUpdateJob(updatedJob);
    alert(`อัปเดตสถานะใบเสนอราคาเป็น: ${
      newStatus === "Draft" ? "ร่างใบเสนอราคา" :
      newStatus === "PendingApproval" ? "ส่งใบเสนอราคาแล้ว/รอลูกค้าอนุมัติ" :
      newStatus === "Approved" ? "ลูกค้าอนุมัติแล้ว" : "ปฏิเสธ/ไม่อนุมัติ"
    } เรียบร้อยแล้ว`);
  };

  const handleConvertToInstallation = () => {
    if (!activeJob) return;
    const confirmed = window.confirm("คุณต้องการแปลงสถานะใบงานนี้เป็น 'งานติดตั้งจริง' พร้อมเริ่มนัดหมายและเปิดใช้งานระบบรับประกันสินค้า 1 ปี สิทธิ์ Onsite Service ฟรี 3 ครั้ง ใช่หรือไม่?");
    if (!confirmed) return;

    const calculateEndDate = (start: string, years: number): string => {
      try {
        const d = new Date(start);
        d.setFullYear(d.getFullYear() + years);
        return d.toISOString().split("T")[0];
      } catch (err) {
        return start;
      }
    };

    const updatedJob: Job = {
      ...activeJob,
      jobType: "Installation",
      status: "Pending",
      notes: `[แปลงมาจากใบสำรวจหน้างาน] ${activeJob.notes || ""}\n\nบันทึกสภาพแวดล้อมสำรวจ: ${activeJob.surveyDetails?.environmentNotes || ""}\nใบเสนอราคาเลขที่: ${activeJob.quotationDetails?.quotationNumber || ""}`,
      warranty: {
        warrantyStartDate: new Date().toISOString().split("T")[0],
        warrantyEndDate: calculateEndDate(new Date().toISOString().split("T")[0], 1),
        totalFreeServices: 3,
        usedFreeServices: 0,
        claims: [],
      },
    };

    onUpdateJob(updatedJob);
    alert("🎉 ยินดีด้วย! แปลงสถานะใบงานเป็น 'งานติดตั้งจริง' พร้อมเปิดระบบประกันสินค้า 1 ปี + Onsite ฟรี 3 ครั้ง สำเร็จเรียบร้อยแล้ว!");
    setDetailsTab("equipments");
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !address || !date || !startTime || !endTime) {
      alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    const calculateEndDate = (start: string, years: number): string => {
      if (!start) return "";
      try {
        const d = new Date(start);
        d.setFullYear(d.getFullYear() + years);
        return d.toISOString().split("T")[0];
      } catch (err) {
        return start;
      }
    };

    const warranty = enableWarranty ? {
      warrantyStartDate: date,
      warrantyEndDate: calculateEndDate(date, warrantyTermYears),
      totalFreeServices: freeServiceCount,
      usedFreeServices: 0,
      claims: [],
    } : undefined;

    const surveyDetails = jobType === "SiteSurvey" ? {
      surveyDate: date,
      surveyDistanceKm: 15,
      cameraPointsEst: 4,
      cableLengthEst: 120,
      powerPointsEst: 2,
      environmentNotes: notes || "ลูกค้าต้องการติดตั้งกล้องวงจรปิดรอบบริเวณบ้านเดี่ยว 2 ชั้น",
      surveyPhotos: [],
    } : undefined;

    const quotationDetails = jobType === "SiteSurvey" ? {
      quotationNumber: `QT-${Math.floor(100000 + Math.random() * 900000)}`,
      items: [
        { name: "กล้อง CCTV ความละเอียดสูง HD IP Camera", quantity: 4, pricePerUnit: 2500, total: 10000 },
        { name: "สายสัญญาณสำเร็จรูปพร้อมหัวต่อ RJ45 Outdoor", quantity: 4, pricePerUnit: 350, total: 1400 },
        { name: "เครื่องบันทึกภาพ NVR 8CH พร้อม Harddisk 2TB", quantity: 1, pricePerUnit: 6500, total: 6500 },
        { name: "ค่าบริการติดตั้ง On-site Service ติดตั้ง+ประกัน 1 ปี", quantity: 1, pricePerUnit: 3500, total: 3500 },
      ],
      totalPrice: 21400,
      grandTotal: 21400,
      vatEnabled: false,
      notes: "ราคารวมบริการ onsite service ตรวจเช็คฟรี 3 ครั้ง ในรอบ 1 ปีหลังการติดตั้งเสร็จสิ้น",
      status: "Draft" as const,
    } : undefined;

    const newJob: Job = {
      id: "JOB-" + Math.floor(1000 + Math.random() * 9000),
      customerName,
      jobType,
      phone,
      address,
      date,
      startTime,
      endTime,
      notes,
      status: "Pending",
      reminders,
      equipmentSerials: [],
      technicianName: currentUser?.displayName || "วิชัย ช่างเทคนิค",
      warranty,
      surveyDetails,
      quotationDetails,
    };

    onCreateJob(newJob);

    // Reset fields
    setCustomerName("");
    setPhone("");
    setAddress("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setNotes("");
    setEnableWarranty(true);
    setWarrantyTermYears(1);
    setFreeServiceCount(3);
    setShowCreateForm(false);
  };

  const handleStatusChange = (job: Job, newStatus: Job["status"]) => {
    const updatedJob: Job = { ...job, status: newStatus };
    onUpdateJob(updatedJob);

    // If canceled, auto delete google calendar event with user confirmation
    if (newStatus === "Canceled" && job.googleCalendarEventId) {
      handleDeleteFromGoogleCalendar(job);
    }
  };

  const handleDeleteClick = (job: Job) => {
    const confirmed = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบใบงาน "${job.id}"?`);
    if (!confirmed) return;

    if (job.googleCalendarEventId) {
      handleDeleteFromGoogleCalendar(job, true);
    }
    onDeleteJob(job.id);
    setSelectedJobId(null);
  };

  // Share schedules via LINE, Email, SMS
  const handleShare = (job: Job, channel: "line" | "sms" | "email") => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`;
    const text = `แจ้งตารางนัดหมายติดตั้งอุปกรณ์\nลูกค้า: ${job.customerName}\nประเภทงาน: ${job.jobType}\nวันที่: ${job.date}\nเวลา: ${job.startTime} - ${job.endTime} น.\nเบอร์โทรช่าง: ${job.phone}\nสถานที่: ${job.address}\nแผนที่นำทาง: ${mapsUrl}`;

    if (channel === "line") {
      window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, "_blank");
    } else if (channel === "sms") {
      window.open(`sms:${job.phone}?body=${encodeURIComponent(text)}`, "_blank");
    } else if (channel === "email") {
      window.open(
        `mailto:?subject=${encodeURIComponent(
          `ยืนยันเวลานัดหมายเข้าปฏิบัติงาน - คุณ ${job.customerName}`
        )}&body=${encodeURIComponent(text)}`,
        "_blank"
      );
    }
  };

  const getJobTypeLabel = (type: Job["jobType"]) => {
    switch (type) {
      case "SiteSurvey":
        return "สำรวจหน้างานก่อนติดตั้ง";
      case "Installation":
        return "ติดตั้งอุปกรณ์";
      case "Repair":
        return "ซ่อมแซม";
      case "Maintenance":
        return "บำรุงรักษา";
      case "Emergency":
        return "ด่วนที่สุด";
      case "Relocation":
        return "ย้ายจุดติดตั้ง";
      case "Expansion":
        return "ขยายระบบ";
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (activeTabFilter === "All") return true;
    return job.status === activeTabFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">ระบบจัดการใบงาน (Jobs Ledger)</h2>
          <p className="text-xs text-slate-500">สร้างใบงานใหม่ มอบหมายงาน และเริ่มสแกนอุปกรณ์เพื่อเพิ่มลงประวัติได้ทันที</p>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg transition shadow-sm flex items-center gap-2 self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" /> สร้างใบงานใหม่
        </button>
      </div>

      {/* Filter Tabs and Jobs listing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Jobs Feed List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Scrollable Filters row */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {(["All", "Pending", "In Progress", "Completed", "Canceled"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveTabFilter(filter)}
                className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition shrink-0 cursor-pointer ${
                  activeTabFilter === filter
                    ? "bg-slate-950 text-white shadow-sm"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {filter === "All"
                  ? "ทั้งหมด"
                  : filter === "Pending"
                  ? "รอดำเนินการ"
                  : filter === "In Progress"
                  ? "กำลังทำ"
                  : filter === "Completed"
                  ? "เสร็จสิ้น"
                  : "ยกเลิก"}
              </button>
            ))}
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
                <p className="text-xs font-semibold text-slate-500">ไม่มีใบงานในสถานะนี้</p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`p-4 rounded-xl border transition text-left cursor-pointer ${
                    selectedJobId === job.id
                      ? "bg-slate-900 border-slate-900 text-white shadow-md"
                      : "bg-white border-slate-200 hover:border-slate-350 text-slate-700 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        selectedJobId === job.id
                          ? "bg-white/15 text-blue-400"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {getJobTypeLabel(job.jobType)}
                    </span>
                    <span className="font-mono text-xs font-bold opacity-60">{job.id}</span>
                  </div>

                  <h3 className="font-bold text-sm line-clamp-1">{job.customerName}</h3>

                  <div className="flex items-center gap-3.5 mt-3 text-xs opacity-80 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 shrink-0" /> {job.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 shrink-0" /> {job.startTime} น.
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-dashed border-current/10 text-xs font-semibold">
                    <span className="opacity-80 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> {job.equipmentSerials.length} อุปกรณ์
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        job.status === "Completed"
                          ? "bg-green-600 text-white"
                          : job.status === "In Progress"
                          ? "bg-blue-600 text-white"
                          : job.status === "Canceled"
                          ? "bg-rose-600 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Active Job Details Drawer */}
        <div className="lg:col-span-2">
          {activeJob ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md">
                      {activeJob.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      ผู้บันทึก: {activeJob.technicianName || "วิชัย ช่างเทคนิค"}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">{activeJob.customerName}</h3>
                </div>

                <div className="flex gap-2 self-start">
                  <select
                    value={activeJob.status}
                    onChange={(e) => handleStatusChange(activeJob, e.target.value as Job["status"])}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-slate-900"
                  >
                    <option value="Pending">Pending (รอดำเนินการ)</option>
                    <option value="In Progress">In Progress (กำลังทำ)</option>
                    <option value="Completed">Completed (เสร็จสิ้น)</option>
                    <option value="Canceled">Canceled (ยกเลิกแล้ว)</option>
                  </select>

                  <button
                    onClick={() => handleDeleteClick(activeJob)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                    title="ลบใบงาน"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid meta info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="text-slate-400 font-normal">เบอร์ติดต่อลูกค้า</div>
                      <a href={`tel:${activeJob.phone}`} className="font-semibold text-slate-800 hover:underline">
                        {activeJob.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="text-slate-400 font-normal">เวลาเข้าดำเนินการ</div>
                      <span className="font-semibold text-slate-800">
                        {activeJob.date} | {activeJob.startTime} - {activeJob.endTime} น.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-start gap-2.5 text-xs font-medium text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-slate-400 font-normal">ที่อยู่ติดตั้งอุปกรณ์</div>
                      <span className="font-semibold text-slate-800 line-clamp-2">{activeJob.address}</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          activeJob.address
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5 mt-1"
                      >
                        เปิดใน Google Maps <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {activeJob.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <span className="font-bold text-slate-700 block mb-1">หมายเหตุ:</span>
                  {activeJob.notes}
                </div>
              )}

              {/* Connect Google Calendar triggers */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center justify-center sm:justify-start gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    ซิงค์ข้อมูลกับ Google Calendar
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-sm">
                    ส่งตารางนัดหมายตรงเข้าสู่ปฏิทินของช่างเทคนิคโดยอัตโนมัติ พร้อมตั้งเตือนนัดหมาย และลิงก์แผนที่นำทาง
                  </p>
                </div>

                {activeJob.googleCalendarEventId ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> เชื่อมต่อกับ Calendar แล้ว
                    </span>
                    <button
                      onClick={() => handleUpdateGoogleCalendar(activeJob)}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:underline"
                    >
                      กดอัปเดตข้อมูลปฏิทินซ้ำ
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAddToGoogleCalendar(activeJob)}
                    disabled={isSyncing === activeJob.id}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSyncing === activeJob.id ? "กำลังเชื่อมโยง..." : "เพิ่มลง Google Calendar"}
                  </button>
                )}
              </div>

              {/* Share Schedules Panel */}
              <div className="space-y-2 pb-2">
                <h4 className="font-bold text-xs text-slate-700">ส่งต่อตารางนัดหมายให้ลูกค้า</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleShare(activeJob, "line")}
                    className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" /> แชร์ไป LINE
                  </button>

                  <button
                    onClick={() => handleShare(activeJob, "sms")}
                    className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" /> ส่ง SMS นัด
                  </button>

                  <button
                    onClick={() => handleShare(activeJob, "email")}
                    className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" /> ส่ง Email นัด
                  </button>
                </div>
              </div>

              {/* Export PDF Reports Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    ออกใบงาน & พิมพ์รายงาน PDF (Kingcom Print Layout)
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold">พิมพ์ขนาด A4 พร้อมหัวจดหมาย</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => { setReportType("handover"); setShowReportModal(true); }}
                    className="py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-600" /> ใบส่งมอบงาน
                  </button>
                  <button
                    onClick={() => { setReportType("service"); setShowReportModal(true); }}
                    className="py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-600" /> Service Report
                  </button>
                  <button
                    onClick={() => { setReportType("installation"); setShowReportModal(true); }}
                    className="py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-600" /> Job ติดตั้ง
                  </button>
                  <button
                    onClick={() => { setReportType("pm"); setShowReportModal(true); }}
                    className="py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-600" /> PM Report
                  </button>
                </div>
              </div>

              {/* Dynamic Tabs Navigation within selected job */}
              <div className="border-b border-slate-200 dark:border-slate-800 pt-2">
                <div className="flex gap-1 overflow-x-auto pb-px">
                  {(["survey", "equipments", "checklist", "testing", "photos", "signature", "warranty"] as const).map((t) => {
                    if (t === "survey" && activeJob.jobType !== "SiteSurvey" && !activeJob.surveyDetails) return null;
                    return (
                      <button
                        key={t}
                        onClick={() => setDetailsTab(t)}
                        className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          detailsTab === t
                            ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-extrabold"
                            : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                        }`}
                      >
                        {t === "survey" && <FileText className="w-4 h-4 text-amber-500" />}
                        {t === "equipments" && <Layers className="w-4 h-4" />}
                        {t === "checklist" && <CheckSquare className="w-4 h-4" />}
                        {t === "testing" && <Activity className="w-4 h-4" />}
                        {t === "photos" && <ImageIcon className="w-4 h-4" />}
                        {t === "signature" && <User className="w-4 h-4" />}
                        {t === "warranty" && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                        
                        {t === "survey" && "สำรวจ & ใบเสนอราคา"}
                        {t === "equipments" && "คลังอุปกรณ์คัดกรอง"}
                        {t === "checklist" && "เช็คลิสต์ตรวจงาน"}
                        {t === "testing" && "ทดสอบความเร็วเน็ต"}
                        {t === "photos" && "รูปถ่ายก่อน-หลัง"}
                        {t === "signature" && "ลายมือชื่อลูกค้า"}
                        {t === "warranty" && "ประกัน & บริการฟรี"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Layout Display Area */}
              <div className="pt-2 space-y-4">
                {/* 0. Site Survey & Quotation Tab */}
                {detailsTab === "survey" && (
                  <div className="space-y-6">
                    {/* Status Alert Banner */}
                    <div className="p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs bg-gradient-to-r from-amber-500/10 to-blue-500/10 border-amber-500/20 dark:border-amber-500/30">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                            ขั้นตอน: สำรวจหน้างานและจัดทำใบเสนอราคาก่อนติดตั้ง
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          ช่างเทคนิคลงสำรวจพื้นที่ ประเมินจุดติดตั้ง จากนั้นทำใบเสนอราคาเสนอเพื่อรอกระบวนการอนุมัติ
                        </p>
                      </div>

                      {/* Status pill in banner */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">สถานะใบเสนอราคา:</span>
                        <select
                          value={activeJob.quotationDetails?.status || "Draft"}
                          onChange={(e) => handleUpdateQuotationStatus(e.target.value as any)}
                          className={`text-xs font-black px-3 py-1.5 rounded-xl border focus:outline-none cursor-pointer ${
                            activeJob.quotationDetails?.status === "Approved"
                              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                              : activeJob.quotationDetails?.status === "PendingApproval"
                              ? "bg-blue-500/20 border-blue-500/30 text-blue-700 dark:text-blue-400 animate-pulse"
                              : activeJob.quotationDetails?.status === "Rejected"
                              ? "bg-rose-500/20 border-rose-500/30 text-rose-700 dark:text-rose-400"
                              : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          <option value="Draft">Draft (ร่างใบเสนอราคา)</option>
                          <option value="PendingApproval">Pending Approval (ส่งแล้ว/รออนุมัติ)</option>
                          <option value="Approved">Approved (ลูกค้าอนุมัติแล้ว)</option>
                          <option value="Rejected">Rejected (ไม่อนุมัติ/ยกเลิก)</option>
                        </select>
                      </div>
                    </div>

                    {/* Convert to Installation Block (Only if Approved and jobType is SiteSurvey) */}
                    {activeJob.quotationDetails?.status === "Approved" && activeJob.jobType === "SiteSurvey" && (
                      <div className="p-5 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-500/30 dark:border-emerald-500/40 rounded-3xl space-y-3.5 shadow-xs">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-extrabold text-emerald-800 dark:text-emerald-300 text-sm">ลูกค้ากดอนุมัติ (Approved) การติดตั้งเรียบร้อยแล้ว!</h4>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed font-medium mt-1">
                              เอกสารและราคาได้รับการยืนยันแล้ว สามารถเปลี่ยนประเภทใบงานเป็น "งานติดตั้งจริง" เพื่อเริ่มกระบวนการสแกนอุปกรณ์, เข้าดำเนินการเชื่อมสัญญาณ และระบบจะเปิดประกัน 1 ปี Onsite ฟรี 3 ครั้งให้ทันที
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleConvertToInstallation}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" /> แปลงเป็นใบงานเข้าติดตั้งและเปิดสิทธิ์รับประกันภัย (1 ปี + Onsite ฟรี 3 ครั้ง)
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {/* Left: Site Survey Info */}
                      <div className="bg-slate-50/80 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <MapPin className="w-4.5 h-4.5 text-amber-500" />
                            ข้อมูลรายงานสำรวจหน้างาน (Onsite Survey Details)
                          </h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">วันที่ลงสำรวจหน้างาน *</label>
                            <input
                              type="date"
                              value={surveyDate}
                              onChange={(e) => setSurveyDate(e.target.value)}
                              className="w-full p-2.5 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">ระยะทางจากศูนย์ (ไป-กลับ กม.)</label>
                            <input
                              type="number"
                              value={surveyDistanceKm}
                              onChange={(e) => setSurveyDistanceKm(Number(e.target.value))}
                              className="w-full p-2.5 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">ประมาณการจุดติดตั้งกล้อง</label>
                            <input
                              type="number"
                              value={cameraPointsEst}
                              onChange={(e) => setCameraPointsEst(Number(e.target.value))}
                              className="w-full p-2.5 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">ความยาวสายสัญญาณที่ใช้ (เมตร)</label>
                            <input
                              type="number"
                              value={cableLengthEst}
                              onChange={(e) => setCableLengthEst(Number(e.target.value))}
                              className="w-full p-2.5 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1 col-span-2">
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">จำนวนจุดจ่ายไฟ AC/PoE ที่ต้องเพิ่ม</label>
                            <input
                              type="number"
                              value={powerPointsEst}
                              onChange={(e) => setPowerPointsEst(Number(e.target.value))}
                              className="w-full p-2.5 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">บันทึกรายละเอียด / อุปสรรคทางกายภาพหน้างาน</label>
                          <textarea
                            value={environmentNotes}
                            onChange={(e) => setEnvironmentNotes(e.target.value)}
                            placeholder="เช่น โครงสร้างผนังเป็นคอนกรีตเสริมเหล็กหนา, ต้องขุดเจาะท่อร้อยสายรอดใต้โรงจอดรถยาว 15 เมตร, คาดว่าจะต้องใช้บันไดยาว 6 เมตร..."
                            rows={3}
                            className="w-full p-3 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none leading-relaxed"
                          />
                        </div>
                      </div>

                      {/* Right: Quotation & Pricing Info */}
                      <div className="bg-slate-50/80 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <FileText className="w-4.5 h-4.5 text-blue-500" />
                            รายการประมาณการราคา (Quotation Details)
                          </h4>
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 font-bold px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono">
                            Auto Calc
                          </span>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">เลขที่เอกสารใบเสนอราคา (Quotation Number)</label>
                          <input
                            type="text"
                            value={quotationNumber}
                            onChange={(e) => setQuotationNumber(e.target.value)}
                            placeholder="QT-XXXXXX"
                            className="w-full p-2.5 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>

                        {/* Quotation Itemized pricing */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">รายการอุปกรณ์และงานโครงสร้าง ({quotationItems.length})</span>
                            <button
                              type="button"
                              onClick={addQuotationItem}
                              className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 px-2 py-1 rounded-lg transition cursor-pointer"
                            >
                              + เพิ่มแถวสินค้า
                            </button>
                          </div>

                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {quotationItems.map((item, idx) => (
                              <div key={idx} className="flex gap-1.5 items-center bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => updateQuotationItem(idx, "name", e.target.value)}
                                  placeholder="ชื่ออุปกรณ์/รายการบริการ"
                                  className="text-xs p-1.5 border-none focus:outline-none focus:ring-0 bg-transparent flex-1 font-semibold text-slate-700 dark:text-slate-200 min-w-0"
                                />
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateQuotationItem(idx, "quantity", e.target.value)}
                                  placeholder="จำนวน"
                                  className="text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg w-12 text-center bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-mono"
                                />
                                <input
                                  type="number"
                                  value={item.pricePerUnit}
                                  onChange={(e) => updateQuotationItem(idx, "pricePerUnit", e.target.value)}
                                  placeholder="ราคา/หน่วย"
                                  className="text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg w-16 text-center bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-mono"
                                />
                                <span className="text-xs font-bold font-mono text-slate-500 dark:text-slate-400 w-16 text-right shrink-0">
                                  {(item.quantity * item.pricePerUnit).toLocaleString()} ฿
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeQuotationItem(idx)}
                                  className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-1.5 rounded transition shrink-0 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Calculation Area */}
                        <div className="bg-white dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>ราคาสินค้ารวม (Subtotal):</span>
                            <span className="font-bold font-mono text-slate-850 dark:text-slate-200">
                              {quotationItems.reduce((acc, item) => acc + (item.quantity * item.pricePerUnit), 0).toLocaleString()} ฿
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={vatEnabled}
                                onChange={(e) => setVatEnabled(e.target.checked)}
                                className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                              />
                              <span>คิดภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                            </label>
                            <span className="font-bold font-mono text-slate-650 dark:text-slate-300">
                              {vatEnabled
                                ? (quotationItems.reduce((acc, item) => acc + (item.quantity * item.pricePerUnit), 0) * 0.07).toLocaleString()
                                : "0"}{" "}
                              ฿
                            </span>
                          </div>

                          <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-slate-850 dark:text-slate-200 font-black text-sm">
                            <span className="text-blue-700 dark:text-blue-400">ยอดรวมทั้งสิ้น (Grand Total):</span>
                            <span className="font-mono text-blue-700 dark:text-blue-400">
                              {(
                                quotationItems.reduce((acc, item) => acc + (item.quantity * item.pricePerUnit), 0) *
                                (vatEnabled ? 1.07 : 1)
                              ).toLocaleString()}{" "}
                              ฿
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">หมายเหตุใบเสนอราคา / เงื่อนไขการชำระเงิน</label>
                          <textarea
                            value={quotationNotes}
                            onChange={(e) => setQuotationNotes(e.target.value)}
                            placeholder="เช่น ยืนราคาในระยะเวลา 30 วัน, แบ่งชำระเป็น 2 งวด (งวดที่ 1 50% ก่อนเข้าหน้างาน, งวดที่ 2 50% หลังส่งมอบงาน)"
                            rows={2}
                            className="w-full p-2.5 text-xs rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveSurveyAndQuotation}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> บันทึกข้อมูลรายงานสำรวจหน้างานและใบเสนอราคา
                    </button>
                  </div>
                )}
                {/* 1. Equipments & Scanner Tab */}
                {detailsTab === "equipments" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">อุปกรณ์ติดตั้งในใบงาน ({activeJob.equipmentSerials.length})</h4>
                      <span className="text-[10px] text-slate-400 font-medium">สแกน QR หรือ S/N เพิ่มอัตโนมัติ</span>
                    </div>

                    {activeJob.equipmentSerials.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        ยังไม่มีการลงทะเบียนอุปกรณ์ในใบงานนี้ สแกนหรือกรอกข้อมูลด้านล่างเพื่อผูกอุปกรณ์เข้ากับงาน
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeJob.equipmentSerials.map((sn) => {
                          const eq = allEquipments.find((e) => e.serialNumber === sn);
                          if (!eq) return null;
                          return (
                            <div
                              key={sn}
                              className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 group hover:border-slate-300 transition"
                            >
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{eq.brand}</span>
                                <h5 className="font-bold text-xs text-slate-800">{eq.model}</h5>
                                <div className="font-mono text-[10px] text-slate-500 font-bold">S/N: {eq.serialNumber}</div>
                              </div>

                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => setStickerTarget(eq)}
                                  className="text-[10px] font-bold text-blue-700 bg-blue-50/60 hover:bg-blue-100/60 border border-blue-200 px-2.5 py-1.5 rounded-lg transition"
                                >
                                  พิมพ์สติ๊กเกอร์
                                </button>
                                <button
                                  onClick={() => onSearchHistory(eq.serialNumber)}
                                  className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition"
                                  title="ดูประวัติอุปกรณ์"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Print sticker preview modal */}
                    {stickerTarget && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative">
                        <button
                          onClick={() => setStickerTarget(null)}
                          className="absolute top-3 right-3 text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer animate-pulse"
                        >
                          ปิดตัวอย่าง
                        </button>
                        <PrintSticker equipment={stickerTarget} />
                      </div>
                    )}

                    {/* Embed Active Scanner Component inside job */}
                    {activeJob.status !== "Completed" && activeJob.status !== "Canceled" && (
                      <Scanner
                        onScanSuccess={(eq) => onAddEquipmentToJob(activeJob.id, eq)}
                        existingSerials={activeJob.equipmentSerials}
                        allEquipments={allEquipments}
                        onSearchHistory={onSearchHistory}
                      />
                    )}
                  </div>
                )}

                {/* 2. Onsite Checklist Tab */}
                {detailsTab === "checklist" && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">เช็คลิสต์ตรวจรับและประเมินงานหน้างาน</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-350 transition cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklistLan}
                            onChange={(e) => setChecklistLan(e.target.checked)}
                            className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs font-bold text-slate-700">สาย LAN & หัวเชื่อมต่อ RJ45</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-350 transition cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklistPoe}
                            onChange={(e) => setChecklistPoe(e.target.checked)}
                            className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs font-bold text-slate-700">แหล่งจ่ายไฟ PoE Switch / Injector</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-350 transition cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklistPower}
                            onChange={(e) => setChecklistPower(e.target.checked)}
                            className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs font-bold text-slate-700">ระบบไฟฟ้า AC & สายกราวด์</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-350 transition cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklistInternet}
                            onChange={(e) => setChecklistInternet(e.target.checked)}
                            className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs font-bold text-slate-700">สัญญาณอินเทอร์เน็ต WAN/ONU</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-350 transition cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklistPing}
                            onChange={(e) => setChecklistPing(e.target.checked)}
                            className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs font-bold text-slate-700">ทดสอบปิงภายในเกตเวย์ (Ping)</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-350 transition cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklistCamera}
                            onChange={(e) => setChecklistCamera(e.target.checked)}
                            className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs font-bold text-slate-700">สัญญาณภาพกล้อง CCTV ครบทุกช่อง</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-350 transition cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklistHdd}
                            onChange={(e) => setChecklistHdd(e.target.checked)}
                            className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs font-bold text-slate-700">สถานะบันทึกฮาร์ดดิสก์ HDD / NVR</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-350 transition cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklistUps}
                            onChange={(e) => setChecklistUps(e.target.checked)}
                            className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs font-bold text-slate-700">เครื่องสำรองไฟ UPS & แบตเตอรี่</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-350 transition cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklistRouter}
                            onChange={(e) => setChecklistRouter(e.target.checked)}
                            className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs font-bold text-slate-700">เราเตอร์ Router & WiFi Access Point</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-350 transition cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklistSwitch}
                            onChange={(e) => setChecklistSwitch(e.target.checked)}
                            className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs font-bold text-slate-700">ความร้อนตู้แร็ค Rack / สวิตซ์ Hub</span>
                        </label>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-600">บันทึกอาการเสียและการวิเคราะห์เทคนิค</label>
                        <textarea
                          value={checklistNotes}
                          onChange={(e) => setChecklistNotes(e.target.value)}
                          placeholder="กรอกผลตรวจสอบเพิ่มเติม เช่น ตรวจสอบความร้อนปกติ, สายแลนชำรุดแก้ไขแล้ว..."
                          rows={3}
                          className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                      </div>

                      <button
                        onClick={handleSaveChecklist}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> บันทึกใบเช็คลิสต์ตรวจสอบหน้างาน
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. System Testing Tab */}
                {detailsTab === "testing" && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">เครื่องมือทดสอบประสิทธิภาพระบบเครือข่ายความเร็วสูง</h4>
                        <span className="text-[10px] text-slate-400 font-bold">เทสจริงผ่าน Gateway</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-600">ที่อยู่ IP สำหรับทดสอบ Ping</label>
                          <input
                            type="text"
                            value={pingIp}
                            onChange={(e) => setPingIp(e.target.value)}
                            placeholder="เช่น 192.168.1.1 หรือ 8.8.8.8"
                            className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-600">สถิติความหน่วง (Latency)</label>
                          <input
                            type="text"
                            value={latency}
                            onChange={(e) => setLatency(e.target.value)}
                            placeholder="เช่น 15 ms"
                            className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-600">อัตราแพ็กเก็ตสูญหาย (Packet Loss)</label>
                          <input
                            type="text"
                            value={packetLoss}
                            onChange={(e) => setPacketLoss(e.target.value)}
                            placeholder="เช่น 0% หรือ 1.5%"
                            className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-600">Download Speed</label>
                            <input
                              type="text"
                              value={bwDownload}
                              onChange={(e) => setBwDownload(e.target.value)}
                              placeholder="เช่น 950 Mbps"
                              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-600">Upload Speed</label>
                            <input
                              type="text"
                              value={bwUpload}
                              onChange={(e) => setBwUpload(e.target.value)}
                              placeholder="เช่น 450 Mbps"
                              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white font-mono focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-600">บันทึกหมายเหตุการทดสอบระบบ</label>
                        <textarea
                          value={testNotes}
                          onChange={(e) => setTestNotes(e.target.value)}
                          placeholder="รายละเอียดเช่น: ทดสอบความเร็วอินเทอร์เน็ตผ่านสาย LAN วิ่งเต็มแพ็คเกจ 1000/500 Mbps เสถียรดี..."
                          rows={2}
                          className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleSimulateSystemTest}
                          disabled={isSimulatingTest}
                          className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <Activity className={`w-4 h-4 ${isSimulatingTest ? "animate-spin" : ""}`} />
                          {isSimulatingTest ? "กำลังรันจำลองทดสอบ..." : "เริ่มรันเทสจำลองระบบ"}
                        </button>
                        <button
                          onClick={handleSaveSystemTest}
                          className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> บันทึกผลเทสลงใบงาน
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Photos Management Tab */}
                {detailsTab === "photos" && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-6">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">คลังภาพถ่ายบันทึกการส่งมอบงานหน้างาน</h4>
                        <p className="text-[10px] text-slate-400">อัปโหลดภาพถ่ายหลักฐานแยกประเภทเพื่อแนบเข้ากับไฟล์ PDF โดยอัตโนมัติ</p>
                      </div>

                      {(["before", "during", "after"] as const).map((folder) => {
                        const folderLabel = folder === "before" ? "สภาพหน้างานก่อนทำ (Before)" : folder === "during" ? "ภาพระหว่างการดำเนินงาน (During)" : "ผลงานการส่งมอบหลังทำ (After)";
                        const folderPhotos = activeJob.photos?.[folder] || [];

                        return (
                          <div key={folder} className="space-y-2.5 p-3 bg-white border border-slate-200 rounded-2xl">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">{folderLabel}</span>
                              <span className="text-[10px] font-bold text-slate-400">{folderPhotos.length} รูป</span>
                            </div>

                            {/* Thumbnail list */}
                            {folderPhotos.length > 0 && (
                              <div className="grid grid-cols-4 gap-2">
                                {folderPhotos.map((src, idx) => (
                                  <div key={idx} className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
                                    <img src={src} alt="Job progress preview" className="w-full h-full object-cover" />
                                    <button
                                      onClick={() => handleDeleteJobPhoto(folder, idx)}
                                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition duration-150 cursor-pointer"
                                    >
                                      ลบรูปภาพ
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Upload Area */}
                            <label className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl transition cursor-pointer text-xs font-semibold text-slate-600">
                              <Camera className="w-4 h-4 text-slate-400" />
                              <span>แนบรูปถ่าย {folder === "before" ? "ก่อนทำ" : folder === "during" ? "ระหว่างทำ" : "หลังทำ"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleJobPhotoUpload(folder, e)}
                                className="hidden"
                              />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5. Customer Signature Tab */}
                {detailsTab === "signature" && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">ลงลายมือชื่อผู้รับมอบงาน / ผู้ว่าจ้าง</h4>
                        <p className="text-[10px] text-slate-400">ใช้ปากกาสไตลัสหรือนิ้วมือเซ็นชื่อลงบนกรอบด้านล่างเพื่อผูกกับใบส่งมอบงาน</p>
                      </div>

                      {activeJob.signature ? (
                        <div className="space-y-3">
                          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center">
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded mb-2.5">เซ็นลายชื่อแล้ว</span>
                            <img src={activeJob.signature} alt="Client Signature" className="max-w-xs h-24 object-contain border-b border-slate-200" />
                          </div>
                          <button
                            onClick={() => {
                              const conf = window.confirm("ต้องการลบลายเซ็นเดิมแล้วเซ็นใหม่อีกครั้ง ใช่หรือไม่?");
                              if (conf) {
                                const updatedJob: Job = { ...activeJob, signature: undefined };
                                onUpdateJob(updatedJob);
                              }
                            }}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            ลบลายเซ็นและเริ่มใหม่ (Re-sign)
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="border-2 border-dashed border-slate-300 bg-white rounded-2xl p-1 relative overflow-hidden">
                            <canvas
                              ref={canvasRef}
                              width={500}
                              height={200}
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              onTouchStart={startDrawing}
                              onTouchMove={draw}
                              onTouchEnd={stopDrawing}
                              className="w-full h-44 bg-white cursor-crosshair blockTouchScroll"
                            />
                            <div className="absolute top-2 left-2 pointer-events-none text-[10px] text-slate-400 font-semibold bg-slate-50/80 px-2 py-0.5 rounded">
                              กรอบเซ็นลายมือชื่อลูกค้า
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={clearSignature}
                              className="py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <RotateCcw className="w-4 h-4" /> ล้างหน้าจอเซ็น
                            </button>
                            <button
                              onClick={saveSignature}
                              className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Check className="w-4 h-4" /> บันทึกและเซฟลายเซ็น
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. Warranty & Free Service Tab */}
                {detailsTab === "warranty" && (
                  <div className="space-y-4">
                    {!activeJob.warranty ? (
                      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-blue-50 dark:bg-blue-950/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">ใบงานนี้ยังไม่ได้เปิดใช้งานการรับประกันสินค้า & บริการฟรี</h4>
                          <p className="text-xs text-slate-400 dark:text-slate-400 max-w-sm mx-auto">
                            ระบบประกันภัยจะช่วยคำนวณการรับประกันเป็นเวลา 1 ปี นับจากวันที่ติดตั้ง พร้อมให้สิทธิ์บริการ Onsite Service เข้าแก้ปัญหาระบบฟรี 3 ครั้ง
                          </p>
                        </div>
                        <button
                          onClick={handleEnableWarrantyRetroactive}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          เปิดใช้งานระบบรับประกัน 1 ปี + บริการฟรี 3 ครั้ง
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Warranty Status Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/20 dark:to-teal-950/20 p-4 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 flex flex-col justify-between space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">Active Warranty</span>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">การรับประกันสินค้าและบริการ</h4>
                              </div>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                                new Date().toISOString().split("T")[0] <= activeJob.warranty.warrantyEndDate
                                  ? "bg-emerald-500/25 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                                  : "bg-rose-500/25 border-rose-500/30 text-rose-800 dark:text-rose-300"
                              }`}>
                                {new Date().toISOString().split("T")[0] <= activeJob.warranty.warrantyEndDate ? "กำลังคุ้มครอง" : "หมดอายุประกัน"}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs border-t border-emerald-500/10 dark:border-emerald-500/20 pt-2.5">
                              <div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">วันที่เริ่มรับประกัน</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{activeJob.warranty.warrantyStartDate}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">วันที่สิ้นสุดประกัน</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{activeJob.warranty.warrantyEndDate}</span>
                              </div>
                            </div>
                          </div>

                          {/* Free Service Tracker Card */}
                          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <span className="text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">Service Quota</span>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">สิทธิ์บริการ Onsite Service ฟรี</h4>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                                  {activeJob.warranty.totalFreeServices - activeJob.warranty.usedFreeServices}
                                </span>
                                <span className="text-xs text-slate-400"> / {activeJob.warranty.totalFreeServices} ครั้ง</span>
                              </div>
                            </div>

                            {/* Meter Bar */}
                            <div className="space-y-1.5">
                              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                                  style={{
                                    width: `${((activeJob.warranty.totalFreeServices - activeJob.warranty.usedFreeServices) / activeJob.warranty.totalFreeServices) * 100}%`,
                                  }}
                                />
                              </div>
                              <p className="text-[10px] text-slate-400 flex justify-between">
                                <span>ใช้ไปแล้ว {activeJob.warranty.usedFreeServices} ครั้ง</span>
                                <span>คงเหลือ {activeJob.warranty.totalFreeServices - activeJob.warranty.usedFreeServices} ครั้ง</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Button/Form to Claim Service */}
                        {activeJob.warranty.usedFreeServices < activeJob.warranty.totalFreeServices ? (
                          <div className="space-y-3">
                            {!showClaimForm ? (
                              <button
                                onClick={() => {
                                  setClaimDate(new Date().toISOString().split("T")[0]);
                                  setClaimTechnician(currentUser?.displayName || "วิชัย ช่างเทคนิค");
                                  setShowClaimForm(true);
                                }}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm animate-pulse"
                              >
                                <CheckCircle className="w-4 h-4" />
                                บันทึกการเข้าเคลม Onsite Service ฟรี (หักสิทธิ์ 1 ครั้ง)
                              </button>
                            ) : (
                              <form onSubmit={handleAddClaim} className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 space-y-3.5">
                                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                                  <h5 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4" />
                                    กรอกข้อมูลประวัติการเคลมบริการ
                                  </h5>
                                  <button
                                    type="button"
                                    onClick={() => setShowClaimForm(false)}
                                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                                  >
                                    ยกเลิก
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">วันที่บริการ *</label>
                                    <input
                                      type="date"
                                      required
                                      value={claimDate}
                                      onChange={(e) => setClaimDate(e.target.value)}
                                      className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ช่างเทคนิคผู้เข้าบริการ *</label>
                                    <input
                                      type="text"
                                      required
                                      value={claimTechnician}
                                      onChange={(e) => setClaimTechnician(e.target.value)}
                                      className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1">รายละเอียดปัญหาและการแก้ไขแก้ไข *</label>
                                  <textarea
                                    required
                                    rows={2}
                                    placeholder="แจ้งปัญหาที่พบ และวิธีแก้ไขเพื่อจัดเก็บในประวัติ..."
                                    value={claimNotes}
                                    onChange={(e) => setClaimNotes(e.target.value)}
                                    className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none resize-none"
                                  />
                                </div>

                                <button
                                  type="submit"
                                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
                                >
                                  บันทึกการส่งเคลมบริการฟรี
                                </button>
                              </form>
                            )}
                          </div>
                        ) : (
                          <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 text-center text-rose-700 dark:text-rose-400 text-xs font-bold">
                            ⚠️ สิทธิ์บริการฟรีหมดอายุการเคลมเรียบร้อยแล้ว
                          </div>
                        )}

                        {/* Claims History logs */}
                        <div className="space-y-2">
                          <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-1">
                            ประวัติการเข้าดูแลและบริการ ({activeJob.warranty.claims.length})
                          </h4>

                          {activeJob.warranty.claims.length === 0 ? (
                            <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                              ยังไม่มีประวัติการแจ้งเคลมสิทธิ์บริการฟรี
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {activeJob.warranty.claims.map((claim) => (
                                <div key={claim.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-850 flex items-start justify-between gap-3 shadow-xs">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                                        {claim.date}
                                      </span>
                                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                        ช่าง: {claim.technicianName}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                      {claim.notes}
                                    </p>
                                  </div>

                                  <button
                                    onClick={() => handleDeleteClaim(claim.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                                    title="ลบประวัตินี้และคืนสิทธิ์"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 text-center p-6">
              <FileText className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 mb-1">เลือกใบงานเพื่อดูรายละเอียด</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                กดเลือกใบงานนัดหมายจากรายการด้านซ้ายเพื่อสแกนอุปกรณ์ ตรวจเช็คหน้างาน ทดสอบเครือข่าย หรือพิมพ์รายงานส่งมอบงาน PDF
              </p>
            </div>
          )}
        </div>
      </div>

      {/* KINGCOM PROFESSIONAL REPORT BUILDER PRINT PREVIEW DIALOG */}
      {showReportModal && activeJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/85 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs print-ignore-overlay">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative print-full-window">
            
            {/* Header controls - hidden during printing */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 print:hidden">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">รายงานตรวจมอบอุปกรณ์ระบบเครือข่าย (A4 Layout)</h3>
                <p className="text-xs text-slate-500">รายงานเอกสารสำเร็จรูปประกอบการเซ็นส่งมอบงาน สวยงามคมชัด</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" /> สั่งพิมพ์ / บันทึกเป็น PDF
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  ปิดหน้ารายงาน
                </button>
              </div>
            </div>

            {/* Document wrapper styled for printing standard */}
            <div id="print-area" className="bg-white text-slate-900 font-sans p-2 select-text print:p-0">
              
              {/* Document Header Logo & Company Info */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-[#155dfc] rounded-xl flex items-center justify-center text-white text-xl font-black">
                    KC
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-slate-900 leading-none">KINGCOM</h1>
                    <span className="text-[10px] font-bold text-[#155dfc] uppercase tracking-widest mt-1 block">Network Solution Provider</span>
                    <p className="text-[9px] text-slate-500 mt-1.5 font-medium leading-relaxed max-w-sm">
                      73/2 หมู่ 4 ต.บางกรวย อ.บางกรวย จ.นนทบุรี 11130 | โทร: 02-123-4567 | TAX ID: 0123456789012
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-slate-400 block uppercase tracking-widest">
                    {reportType === "handover" && "DELIVERABLES REPORT"}
                    {reportType === "service" && "SERVICE REPORT"}
                    {reportType === "installation" && "INSTALLATION REPORT"}
                    {reportType === "pm" && "PREVENTIVE MAINTENANCE"}
                  </span>
                  <h2 className="text-base font-extrabold text-blue-700 mt-1">
                    {reportType === "handover" && "ใบส่งมอบงานและทดสอบอุปกรณ์"}
                    {reportType === "service" && "ใบรายงานการบริการด้านเทคนิค"}
                    {reportType === "installation" && "ใบเสร็จรับเงิน & บันทึกการติดตั้ง"}
                    {reportType === "pm" && "ใบตรวจบำรุงรักษาป้องกันเชิงรุก (PM)"}
                  </h2>
                  <div className="font-mono text-[10px] font-bold text-slate-600 mt-1 bg-slate-100 px-2 py-0.5 rounded inline-block">
                    เลขที่อ้างอิง: {activeJob.id}
                  </div>
                </div>
              </div>

              {/* Client & Metadata Info Grid */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
                <div className="space-y-1.5">
                  <div>
                    <span className="text-slate-400 block font-normal text-[10px]">ผู้รับบริการ / ลูกค้า:</span>
                    <span className="font-bold text-slate-900">{activeJob.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-normal text-[10px]">สถานที่เข้าดำเนินการติดตั้ง:</span>
                    <span className="font-semibold text-slate-700">{activeJob.address}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-normal text-[10px]">เบอร์ติดต่อโทร:</span>
                    <span className="font-mono font-bold text-slate-800">{activeJob.phone}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-right">
                  <div>
                    <span className="text-slate-400 block font-normal text-[10px]">วันที่ดำเนินภารกิจ:</span>
                    <span className="font-bold text-slate-900">{activeJob.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-normal text-[10px]">ช่วงเวลาปฏิบัติงาน:</span>
                    <span className="font-semibold text-slate-800">{activeJob.startTime} - {activeJob.endTime} น.</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-normal text-[10px]">หัวหน้าช่างผู้ประเมิน:</span>
                    <span className="font-bold text-blue-700">{activeJob.technicianName || "วิชัย ช่างเทคนิค"}</span>
                  </div>
                </div>
              </div>

              {/* Table of hardware equipment scanned */}
              <div className="py-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">1. ทะเบียนรายงานการลงอุปกรณ์ (Scanned Hardware Devices)</h3>
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                      <th className="py-2 px-2 font-bold">ประเภทอุปกรณ์</th>
                      <th className="py-2 px-2 font-bold">ยี่ห้อ (Brand)</th>
                      <th className="py-2 px-2 font-bold">รุ่นอุปกรณ์ (Model)</th>
                      <th className="py-2 px-2 font-bold">หมายเลขซีเรียล S/N</th>
                      <th className="py-2 px-2 font-bold">IP Address</th>
                      <th className="py-2 px-2 font-bold">วันสิ้นสุดการรับประกัน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeJob.equipmentSerials.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-3 px-2 text-center text-slate-400 italic">ไม่มีอุปกรณ์ลงทะเบียนผูกไว้ในเอกสารฉบับนี้</td>
                      </tr>
                    ) : (
                      activeJob.equipmentSerials.map((sn) => {
                        const eq = allEquipments.find((e) => e.serialNumber === sn);
                        if (!eq) return null;
                        return (
                          <tr key={sn} className="border-b border-slate-200">
                            <td className="py-2 px-2 font-semibold text-slate-800">{eq.category || "อื่นๆ"}</td>
                            <td className="py-2 px-2">{eq.brand}</td>
                            <td className="py-2 px-2 font-semibold">{eq.model}</td>
                            <td className="py-2 px-2 font-mono font-bold text-slate-700">{eq.serialNumber}</td>
                            <td className="py-2 px-2 font-mono">{eq.ipAddress || "-"}</td>
                            <td className="py-2 px-2 font-mono">{eq.warrantyEnd || "ไม่มีข้อมูล"}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Onsite Checklist Result Box */}
              <div className="py-3 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">2. ผลประเมินโครงสร้างหน้างาน (Onsite Checklists)</h3>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[9px] font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white ${activeJob.checklist?.checkLan ? "bg-blue-600" : "bg-slate-200"}`}>
                        {activeJob.checklist?.checkLan && "✓"}
                      </div>
                      <span>สาย LAN RJ45</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white ${activeJob.checklist?.checkPoe ? "bg-blue-600" : "bg-slate-200"}`}>
                        {activeJob.checklist?.checkPoe && "✓"}
                      </div>
                      <span>แหล่งจ่ายไฟ PoE</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white ${activeJob.checklist?.checkPower ? "bg-blue-600" : "bg-slate-200"}`}>
                        {activeJob.checklist?.checkPower && "✓"}
                      </div>
                      <span>ระบบไฟAC / กราวด์</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white ${activeJob.checklist?.checkInternet ? "bg-blue-600" : "bg-slate-200"}`}>
                        {activeJob.checklist?.checkInternet && "✓"}
                      </div>
                      <span>เครือข่าย WAN/ONU</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white ${activeJob.checklist?.checkPing ? "bg-blue-600" : "bg-slate-200"}`}>
                        {activeJob.checklist?.checkPing && "✓"}
                      </div>
                      <span>ผลเทสสปีดภายใน</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white ${activeJob.checklist?.checkCamera ? "bg-blue-600" : "bg-slate-200"}`}>
                        {activeJob.checklist?.checkCamera && "✓"}
                      </div>
                      <span>สัญญาณกล้อง CCTV</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white ${activeJob.checklist?.checkHdd ? "bg-blue-600" : "bg-slate-200"}`}>
                        {activeJob.checklist?.checkHdd && "✓"}
                      </div>
                      <span>ฮาร์ดดิสก์ HDD / NVR</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white ${activeJob.checklist?.checkUps ? "bg-blue-600" : "bg-slate-200"}`}>
                        {activeJob.checklist?.checkUps && "✓"}
                      </div>
                      <span>เครื่องสำรองไฟ UPS</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white ${activeJob.checklist?.checkRouter ? "bg-blue-600" : "bg-slate-200"}`}>
                        {activeJob.checklist?.checkRouter && "✓"}
                      </div>
                      <span> Router / Access Point</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white ${activeJob.checklist?.checkSwitch ? "bg-blue-600" : "bg-slate-200"}`}>
                        {activeJob.checklist?.checkSwitch && "✓"}
                      </div>
                      <span>ตู้แร็ค Rack & Switch</span>
                    </div>
                  </div>
                </div>

                {/* System Speed Performance results */}
                <div className="space-y-2 border-l border-slate-200 pl-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">3. ผลการวิเคราะห์เครือข่าย (Speed Testing Diagnostics)</h3>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-1.5 bg-slate-50 rounded">
                      <span className="text-[9px] text-slate-400 block">Latency (ความหน่วง)</span>
                      <span className="font-mono font-bold text-slate-800">{activeJob.systemTest?.latency || "ไม่มีข้อมูล"}</span>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded">
                      <span className="text-[9px] text-slate-400 block">Packet Loss (แพ็กสูญหาย)</span>
                      <span className="font-mono font-bold text-slate-800">{activeJob.systemTest?.packetLoss || "ไม่มีข้อมูล"}</span>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded">
                      <span className="text-[9px] text-slate-400 block">ความเร็ว Download</span>
                      <span className="font-mono font-bold text-emerald-600">{activeJob.systemTest?.bandwidthDownload || "ไม่มีข้อมูล"}</span>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded">
                      <span className="text-[9px] text-slate-400 block">ความเร็ว Upload</span>
                      <span className="font-mono font-bold text-emerald-600">{activeJob.systemTest?.bandwidthUpload || "running"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Inspection Notes */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-[10px] text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-800 block mb-0.5">ผลการประเมินช่างและหมายเหตุ (Field Evaluation Remarks):</span>
                {activeJob.checklist?.resultNotes || "สภาพหน้างานปกติดี ระบบเครือข่ายเสถียร สแกนทดสอบการใช้งานกล้องเชื่อมต่อครบถ้วน อุปกรณ์มีสติ๊กเกอร์แปะรับประกัน S/N ครบทุกจุด"}
              </div>

              {/* Warranty and Service claims report section */}
              {activeJob.warranty && (
                <div className="border border-emerald-500/25 bg-emerald-50/20 rounded-xl p-3 space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1">
                    <span className="font-extrabold text-emerald-800">
                      🛡️ รายงานการรับประกันสินค้าและสิทธิ์บริการ (Kingcom Service Guarantee)
                    </span>
                    <span className="font-mono text-emerald-700 font-black">
                      สถานะ: {new Date().toISOString().split("T")[0] <= activeJob.warranty.warrantyEndDate ? "กำลังคุ้มครอง (Active)" : "หมดอายุรับประกัน (Expired)"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-slate-700">
                    <div>
                      <p className="mt-0.5"><strong>ระยะเวลารับประกันสินค้า:</strong> {activeJob.warranty.warrantyStartDate} ถึง {activeJob.warranty.warrantyEndDate} (รับประกันภัย 1 ปี)</p>
                      <p className="mt-0.5"><strong>โควต้าเข้าดูแล Onsite ฟรี:</strong> ได้รับสิทธิ์ {activeJob.warranty.totalFreeServices} ครั้ง | ใช้ไป {activeJob.warranty.usedFreeServices} ครั้ง | คงเหลือ {activeJob.warranty.totalFreeServices - activeJob.warranty.usedFreeServices} ครั้ง</p>
                    </div>
                    <div>
                      <p className="font-bold">บันทึกประวัติการเคลมดูแลระบบฟรี (Service Claim History):</p>
                      {activeJob.warranty.claims.length === 0 ? (
                        <p className="text-slate-400 italic">ยังไม่เคยใช้สิทธิ์เคลมเข้าบริการ</p>
                      ) : (
                        <ul className="list-disc list-inside space-y-0.5 text-[9px] text-slate-600">
                          {activeJob.warranty.claims.map((claim, idx) => (
                            <li key={idx}>
                              วันที่ {claim.date} - ช่าง: {claim.technicianName} ({claim.notes})
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Photos Progress display block */}
              {((activeJob.photos?.before?.length || 0) > 0 || (activeJob.photos?.after?.length || 0) > 0) && (
                <div className="py-4 space-y-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">4. ภาพบันทึกการส่งมอบหน้างาน (Field Inspection Photos)</h3>
                  <div className="grid grid-cols-6 gap-2">
                    {/* Before */}
                    {activeJob.photos?.before?.slice(0, 2).map((src, idx) => (
                      <div key={`b-${idx}`} className="aspect-square rounded border overflow-hidden relative">
                        <img src={src} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[7px] text-center py-0.5">ก่อนเข้าดำเนินงาน</span>
                      </div>
                    ))}
                    {/* During */}
                    {activeJob.photos?.during?.slice(0, 2).map((src, idx) => (
                      <div key={`d-${idx}`} className="aspect-square rounded border overflow-hidden relative">
                        <img src={src} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[7px] text-center py-0.5">ระหว่างงาน</span>
                      </div>
                    ))}
                    {/* After */}
                    {activeJob.photos?.after?.slice(0, 2).map((src, idx) => (
                      <div key={`a-${idx}`} className="aspect-square rounded border overflow-hidden relative">
                        <img src={src} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-blue-900/80 text-white text-[7px] text-center py-0.5">หลังติดตั้งเสร็จ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dual Signature Section Box */}
              <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-center">
                <div className="flex flex-col items-center justify-between h-28">
                  <span className="text-[10px] text-slate-400">ผู้ส่งมอบงาน / ช่างเทคนิคประเมินผล</span>
                  <div className="py-2 font-semibold text-slate-800 border-b border-slate-300 w-44">
                    {activeJob.technicianName || "วิชัย ช่างเทคนิค"}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1">(ช่างเทคนิคผู้ปฏิบัติงาน)</span>
                </div>

                <div className="flex flex-col items-center justify-between h-28">
                  <span className="text-[10px] text-slate-400">ลงชื่อผู้รับมอบงาน / ผู้ว่าจ้างบริษัท</span>
                  {activeJob.signature ? (
                    <img src={activeJob.signature} alt="Client Signature" className="h-10 object-contain" />
                  ) : (
                    <div className="h-10 flex items-center justify-center text-[10px] text-slate-400 italic">ไม่ได้ลงชื่อลายเซ็น</div>
                  )}
                  <div className="border-b border-slate-300 w-44"></div>
                  <span className="text-[9px] text-slate-500 mt-1">(ลายมือชื่อผู้ตรวจรับมอบงาน)</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CREATE JOB FULL DIALOG (MODAL OVERLAY) */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">สร้างใบงานนัดหมายใหม่</h3>
                <p className="text-xs text-slate-500">กรอกข้อมูลผู้จ้างและเวลาเข้าทำงาน ระบบจะจัดส่งตารางและซิงค์ทันที</p>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-800 px-2 py-1 rounded"
              >
                ปิด
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อของลูกค้า / บริษัท *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="เช่น บริษัท ยิ้มสวย จำกัด, คุณกิตติ"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ประเภทงานเข้าปฏิบัติ *</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="SiteSurvey">Site Survey (สำรวจหน้างานก่อนติดตั้ง)</option>
                    <option value="Installation">Installation (ติดตั้งอุปกรณ์)</option>
                    <option value="Repair">Repair (งานซ่อมแซม)</option>
                    <option value="Maintenance">Maintenance (บำรุงรักษา)</option>
                    <option value="Emergency">Emergency (ฉุกเฉินด่วน)</option>
                    <option value="Relocation">Relocation (ย้ายจุดติดตั้ง)</option>
                    <option value="Expansion">Expansion (ขยายระบบ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">เบอร์ติดต่อกลับลูกค้า *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 081-234-5678"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">สถานที่จัดส่ง/ที่ตั้งติดตั้ง *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ที่อยู่อย่างละเอียด พร้อมรหัสไปรษณีย์"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">วันที่เข้าทำงาน *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">เวลาเริ่มงาน *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">เวลาสิ้นสุด *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600">ตั้งค่าการเตือนความจำนัดล่วงหน้า</label>
                <div className="flex gap-2 flex-wrap">
                  {(["1day", "3hours", "1hour", "30min"] as const).map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => {
                        if (reminders.includes(opt)) {
                          setReminders(reminders.filter((r) => r !== opt));
                        } else {
                          setReminders([...reminders, opt]);
                        }
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition cursor-pointer ${
                        reminders.includes(opt)
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {opt === "1day"
                        ? "1 วันก่อนนัด"
                        : opt === "3hours"
                        ? "3 ชั่วโมงก่อน"
                        : opt === "1hour"
                        ? "1 ชั่วโมงก่อน"
                        : "30 นาทีล่วงหน้า"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warranty & Free Service Setup Section */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enableWarranty"
                      checked={enableWarranty}
                      onChange={(e) => setEnableWarranty(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="enableWarranty" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      🛡️ สิทธิ์ประกันภัยและบริการฟรี (Onsite Service)
                    </label>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-md uppercase">
                    PROMO 1 ปี
                  </span>
                </div>

                {enableWarranty && (
                  <div className="grid grid-cols-2 gap-3 pl-6 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">ระยะเวลารับประกันสินค้า</label>
                      <select
                        value={warrantyTermYears}
                        onChange={(e) => setWarrantyTermYears(Number(e.target.value))}
                        className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
                      >
                        <option value={1}>1 ปี (มาตรฐาน)</option>
                        <option value={2}>2 ปี (พรีเมียม)</option>
                        <option value={3}>3 ปี (องค์กร)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">สิทธิ์บริการ Onsite ฟรี</label>
                      <select
                        value={freeServiceCount}
                        onChange={(e) => setFreeServiceCount(Number(e.target.value))}
                        className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none"
                      >
                        <option value={3}>3 ครั้ง (มาตรฐาน)</option>
                        <option value={5}>5 ครั้ง (จุใจ)</option>
                        <option value={10}>10 ครั้ง (สัญญาบริการ)</option>
                        <option value={0}>ไม่มีบริการฟรี</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">รายละเอียดและหมายเหตุเพิ่มเติม</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="รายละเอียดงาน ความต้องการพิเศษ การตั้งค่าเราเตอร์..."
                  rows={3}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 text-white text-sm font-semibold rounded-xl transition shadow-md"
                >
                  บันทึกใบงานใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
