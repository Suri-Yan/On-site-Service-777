export type UserRole = "Admin" | "Manager" | "Technician" | "Viewer";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
}

export type EquipmentCategory =
  | "Camera"
  | "NVR"
  | "DVR"
  | "HDD"
  | "PoE Switch"
  | "Switch"
  | "Router"
  | "ONU"
  | "Access Point"
  | "UPS"
  | "Rack"
  | "Patch Panel"
  | "สาย LAN"
  | "Fiber"
  | "Connector"
  | "Power Supply"
  | "อื่นๆ";

export interface Equipment {
  brand: string;
  model: string;
  serialNumber: string;
  macAddress?: string;
  imei?: string;
  ipAddress?: string;
  username?: string;
  password?: string;
  firmwareVersion?: string;
  category?: EquipmentCategory;
  installationDate?: string;
  customerName?: string;
  location?: string;
  warrantyStart?: string;
  warrantyEnd?: string;
  notes?: string;
  photos: string[]; // Base64 image data strings
}

export interface OnsiteChecklist {
  checkLan: boolean;
  checkPoe: boolean;
  checkPower: boolean;
  checkInternet: boolean;
  checkPing: boolean;
  checkCamera: boolean;
  checkHdd: boolean;
  checkUps: boolean;
  checkRouter: boolean;
  checkSwitch: boolean;
  resultNotes?: string;
}

export interface SystemTestResult {
  pingIp?: string;
  packetLoss?: string;
  latency?: string;
  bandwidthUpload?: string;
  bandwidthDownload?: string;
  resultNotes?: string;
}

export interface JobPhotos {
  before: string[]; // Base64 image strings
  during: string[]; // Base64 image strings
  after: string[];  // Base64 image strings
}

export interface Customer {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  line?: string;
  googleMap?: string;
  latitude?: string;
  longitude?: string;
  address: string;
  venuePhoto?: string; // Base64 image
  notes?: string;
}

export interface FreeServiceClaim {
  id: string;
  date: string;
  notes: string;
  technicianName: string;
}

export interface ServiceWarranty {
  warrantyStartDate: string; // YYYY-MM-DD
  warrantyEndDate: string; // YYYY-MM-DD
  totalFreeServices: number; // Defaults to 3
  usedFreeServices: number; // 0 to 3
  claims: FreeServiceClaim[];
}

export interface Job {
  id: string; // เลขที่งาน
  customerId?: string; // Link to customer (optional for compatibility)
  customerName: string;
  jobType: "Installation" | "Repair" | "Maintenance" | "Relocation" | "Expansion" | "Emergency";
  phone: string;
  address: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  notes?: string;
  googleCalendarEventId?: string;
  status: "Pending" | "In Progress" | "Completed" | "Canceled";
  reminders: ("1day" | "3hours" | "1hour" | "30min")[];
  equipmentSerials: string[]; // Serial numbers connected to this job
  technicianName?: string;
  checklist?: OnsiteChecklist;
  systemTest?: SystemTestResult;
  photos?: JobPhotos;
  signature?: string; // Base64 signature image
  revenue?: number; // Job revenue for reports
  warranty?: ServiceWarranty;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  category: "appointment" | "urgent" | "new" | "rescheduled" | "completed";
  createdAt: string;
  read: boolean;
}

export interface EquipmentHistoryItem {
  date: string;
  type: "Installation" | "Repair" | "Replacement" | "Inspection";
  technician: string;
  jobId: string;
  notes: string;
  photos: string[];
}

