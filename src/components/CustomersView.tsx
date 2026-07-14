import React, { useState } from "react";
import {
  User,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  Navigation,
  MapPin,
  Map,
  Trash2,
  Edit2,
  FileText,
  MessageSquare,
  Camera,
  X,
  AlertCircle
} from "lucide-react";
import { Customer, Job } from "../types";

interface CustomersViewProps {
  customers: Customer[];
  jobs: Job[];
  onCreateCustomer: (newCustomer: Customer) => void;
  onUpdateCustomer: (updatedCustomer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onSelectCustomerForJob?: (customer: Customer) => void;
}

export default function CustomersView({
  customers,
  jobs,
  onCreateCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onSelectCustomerForJob
}: CustomersViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [line, setLine] = useState("");
  const [googleMap, setGoogleMap] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [address, setAddress] = useState("");
  const [venuePhoto, setVenuePhoto] = useState("");
  const [notes, setNotes] = useState("");

  const filteredCustomers = customers.filter((cust) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      cust.name.toLowerCase().includes(q) ||
      (cust.company && cust.company.toLowerCase().includes(q)) ||
      cust.phone.includes(q) ||
      cust.address.toLowerCase().includes(q)
    );
  });

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId) || null;

  const handleOpenForm = (cust: Customer | null = null) => {
    if (cust) {
      setEditingCustomer(cust);
      setName(cust.name);
      setCompany(cust.company || "");
      setPhone(cust.phone);
      setEmail(cust.email || "");
      setLine(cust.line || "");
      setGoogleMap(cust.googleMap || "");
      setLatitude(cust.latitude || "");
      setLongitude(cust.longitude || "");
      setAddress(cust.address);
      setVenuePhoto(cust.venuePhoto || "");
      setNotes(cust.notes || "");
    } else {
      setEditingCustomer(null);
      setName("");
      setCompany("");
      setPhone("");
      setEmail("");
      setLine("");
      setGoogleMap("");
      setLatitude("");
      setLongitude("");
      setAddress("");
      setVenuePhoto("");
      setNotes("");
    }
    setShowForm(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVenuePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address) {
      alert("กรุณากรอก ชื่อ เบอร์โทร และที่อยู่");
      return;
    }

    const payload: Customer = {
      id: editingCustomer?.id || "CUST-" + Math.floor(1000 + Math.random() * 9000),
      name,
      company: company || undefined,
      phone,
      email: email || undefined,
      line: line || undefined,
      googleMap: googleMap || undefined,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      address,
      venuePhoto: venuePhoto || undefined,
      notes: notes || undefined
    };

    if (editingCustomer) {
      onUpdateCustomer(payload);
      alert("แก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว");
    } else {
      onCreateCustomer(payload);
      alert("เพิ่มข้อมูลลูกค้าใหม่เรียบร้อยแล้ว");
    }

    setShowForm(false);
    setSelectedCustomerId(payload.id);
  };

  const handleDelete = (cust: Customer) => {
    const confirmed = window.confirm(`คุณต้องการลบข้อมูลลูกค้า "${cust.name}" ใช่หรือไม่?`);
    if (confirmed) {
      onDeleteCustomer(cust.id);
      setSelectedCustomerId(null);
    }
  };

  const getCustomerJobs = (custName: string) => {
    return jobs.filter(
      (job) => job.customerName.toLowerCase() === custName.toLowerCase()
    );
  };

  return (
    <div className="space-y-6" id="customers-view-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">ฐานข้อมูลลูกค้า (Customer Ledger)</h2>
          <p className="text-xs text-slate-500">บันทึกประวัติ เบอร์โทร แผนที่นำทาง และรูปภาพสถานที่ปฏิบัติงานของลูกค้า</p>
        </div>
        <button
          onClick={() => handleOpenForm(null)}
          className="px-4.5 py-2.5 bg-[#155dfc] hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition shadow-sm flex items-center gap-2 self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" /> เพิ่มข้อมูลลูกค้าใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Feed & Search */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อ, บริษัท, เบอร์โทร..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:outline-none focus:border-[#155dfc] rounded-xl text-sm"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">ไม่พบรายชื่อลูกค้า</p>
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const custJobs = getCustomerJobs(cust.name);
                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                      selectedCustomerId === cust.id
                        ? "bg-slate-900 border-slate-900 text-white shadow-md"
                        : "bg-white border-slate-200 hover:border-slate-350 text-slate-700 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] opacity-60 font-bold">{cust.id}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                        {custJobs.length} ใบงาน
                      </span>
                    </div>
                    <h3 className="font-bold text-sm mt-1.5">{cust.name}</h3>
                    {cust.company && (
                      <div className="flex items-center gap-1 text-xs opacity-80 mt-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{cust.company}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs opacity-80 mt-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{cust.phone}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Customer Details View */}
        <div className="lg:col-span-2">
          {activeCustomer ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6 text-left">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#155dfc]">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{activeCustomer.name}</h3>
                    {activeCustomer.company && (
                      <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" /> {activeCustomer.company}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 self-start">
                  <button
                    onClick={() => handleOpenForm(activeCustomer)}
                    className="p-2 text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> แก้ไขข้อมูล
                  </button>
                  <button
                    onClick={() => handleDelete(activeCustomer)}
                    className="p-2 text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Grid Contact Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">ช่องทางการติดต่อ</h4>
                  <div className="space-y-2.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-slate-400 block">เบอร์โทรศัพท์</span>
                        <a href={`tel:${activeCustomer.phone}`} className="font-semibold text-slate-800 hover:underline">
                          {activeCustomer.phone}
                        </a>
                      </div>
                    </div>

                    {activeCustomer.email && (
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <div>
                          <span className="text-slate-400 block">อีเมล</span>
                          <span className="font-semibold text-slate-800">{activeCustomer.email}</span>
                        </div>
                      </div>
                    )}

                    {activeCustomer.line && (
                      <div className="flex items-center gap-2.5">
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        <div>
                          <span className="text-slate-400 block">Line ID</span>
                          <span className="font-semibold text-slate-800">{activeCustomer.line}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">ที่อยู่และการนำทาง</h4>
                  <div className="space-y-2.5 text-xs text-slate-600">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <span className="text-slate-400 block">ที่อยู่อย่างละเอียด</span>
                        <span className="font-semibold text-slate-800 leading-relaxed">{activeCustomer.address}</span>
                      </div>
                    </div>

                    {(activeCustomer.latitude || activeCustomer.longitude) && (
                      <div className="flex items-center gap-2.5">
                        <Map className="w-4 h-4 text-slate-400" />
                        <div>
                          <span className="text-slate-400 block">พิกัดแผนที่ (Lat, Long)</span>
                          <span className="font-semibold text-slate-800">
                            {activeCustomer.latitude || "-"}, {activeCustomer.longitude || "-"}
                          </span>
                        </div>
                      </div>
                    )}

                    {activeCustomer.googleMap && (
                      <a
                        href={activeCustomer.googleMap}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#155dfc] text-white font-bold rounded-lg text-[11px] hover:bg-blue-700 transition"
                      >
                        <Navigation className="w-3.5 h-3.5" /> เปิดแผนที่นำทาง Google Maps
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Venue photo representation if any */}
              {activeCustomer.venuePhoto && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">รูปภาพสถานที่ปฏิบัติงาน</h4>
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-w-sm">
                    <img
                      src={activeCustomer.venuePhoto}
                      alt="Venue"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                </div>
              )}

              {activeCustomer.notes && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <h5 className="font-bold text-slate-700 mb-1">หมายเหตุเพิ่มเติม:</h5>
                  <p>{activeCustomer.notes}</p>
                </div>
              )}

              {/* Jobs History for this customer */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">ประวัติใบงานติดตั้งและบริการ ({getCustomerJobs(activeCustomer.name).length} รายการ)</h4>
                {getCustomerJobs(activeCustomer.name).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">ยังไม่มีประวัติใบงานของลูกค้าท่านนี้</p>
                ) : (
                  <div className="space-y-2.5">
                    {getCustomerJobs(activeCustomer.name).map((job) => (
                      <div
                        key={job.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800">{job.id} - {job.jobType}</div>
                          <div className="text-slate-400">{job.date} | {job.startTime} น.</div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-[5px] text-[10px] font-bold ${
                            job.status === "Completed"
                              ? "bg-green-50 text-green-700"
                              : job.status === "In Progress"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 text-center p-6">
              <User className="w-12 h-12 text-slate-300 mb-2" />
              <h3 className="font-bold text-slate-700">เลือกรายชื่อลูกค้า</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                กดเลือกรายชื่อลูกค้าจากแผงด้านซ้าย เพื่อดูที่อยู่ เบอร์โทรติดต่อ ตารางแผนที่นำทาง และรูปภาพอาคารสถานที่
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Form Overlay Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base">
                {editingCustomer ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มข้อมูลลูกค้าใหม่"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อ-นามสกุล ลูกค้า *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น คุณกิตติพงษ์ แก้วมณี"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#155dfc]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อบริษัท / ร้านค้า</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="เช่น หจก. คิงคอมกรุ๊ป"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#155dfc]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">เบอร์โทรติดต่อ *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 081-XXX-XXXX"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#155dfc]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Line ID</label>
                  <input
                    type="text"
                    value={line}
                    onChange={(e) => setLine(e.target.value)}
                    placeholder="เช่น @kingcom"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#155dfc]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">อีเมลผู้ติดต่อ</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="เช่น customer@email.com"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#155dfc]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ลิงก์ Google Maps</label>
                <input
                  type="text"
                  value={googleMap}
                  onChange={(e) => setGoogleMap(e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#155dfc]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="เช่น 13.7563"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#155dfc]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="เช่น 100.5018"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#155dfc]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ที่อยู่อย่างละเอียด *</label>
                <textarea
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="เลขที่ หมู่บ้าน ซอย ถนน แขวง เขต จังหวัด..."
                  rows={2}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#155dfc] resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">รูปถ่ายสถานที่หน้างาน</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 text-xs font-bold transition text-slate-700">
                    <Camera className="w-4 h-4 text-slate-500" /> ถ่ายรูป/อัปโหลดรูปภาพ
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {venuePhoto && (
                    <span className="text-[10px] text-emerald-600 font-bold">อัปโหลดรูปภาพแล้ว</span>
                  )}
                </div>
                {venuePhoto && (
                  <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                    <img src={venuePhoto} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setVenuePhoto("")}
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">หมายเหตุ</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="หมายเหตุเพิ่มเติมเกี่ยวกับลูกค้ารายนี้..."
                  rows={2}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#155dfc] resize-none"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#155dfc] hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-md"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
