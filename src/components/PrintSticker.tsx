import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Printer, Check, Copy, Tag, QrCode as QrIcon } from "lucide-react";
import { Equipment } from "../types";

interface PrintStickerProps {
  equipment: Equipment;
  onClose?: () => void;
}

export default function PrintSticker({ equipment, onClose }: PrintStickerProps) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Generate QR Code data: we can pack JSON or a structured URL
    const qrData = JSON.stringify({
      brand: equipment.brand,
      model: equipment.model,
      serialNumber: equipment.serialNumber,
      mac: equipment.macAddress || "",
      imei: equipment.imei || "",
    });

    QRCode.toDataURL(
      qrData,
      {
        width: 180,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      },
      (err, url) => {
        if (!err) {
          setQrUrl(url);
        } else {
          console.error("QR Generation error:", err);
        }
      }
    );
  }, [equipment]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("กรุณาอนุญาตป็อปอัปเพื่อพิมพ์สติ๊กเกอร์");
      return;
    }

    // Modern clean print template layout
    printWindow.document.write(`
      <html>
        <head>
          <title>พิมพ์สติ๊กเกอร์ - ${equipment.serialNumber}</title>
          <style>
            @page {
              size: 80mm 50mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Helvetica Neue', Arial, sans-serif;
              width: 80mm;
              height: 50mm;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #fff;
            }
            .sticker {
              width: 74mm;
              height: 44mm;
              border: 1px solid #000;
              box-sizing: border-box;
              padding: 2.5mm;
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: space-between;
              border-radius: 2mm;
            }
            .details {
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              height: 100%;
              width: 44mm;
            }
            .header {
              font-size: 11pt;
              font-weight: bold;
              border-bottom: 1.5px solid #000;
              padding-bottom: 1mm;
              margin-bottom: 1.5mm;
              text-transform: uppercase;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .meta-row {
              font-size: 8pt;
              margin-bottom: 0.8mm;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .meta-label {
              font-weight: bold;
              display: inline-block;
              width: 12mm;
            }
            .barcode-sim {
              margin-top: auto;
              height: 6mm;
              display: flex;
              flex-direction: row;
              align-items: flex-end;
              gap: 0.5px;
            }
            .barcode-bar {
              background-color: #000;
              width: 1px;
            }
            .barcode-text {
              font-family: monospace;
              font-size: 6pt;
              text-align: center;
              margin-top: 0.5mm;
              letter-spacing: 1px;
            }
            .qr-side {
              width: 25mm;
              height: 25mm;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-image {
              width: 100%;
              height: 100%;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="sticker">
            <div class="details">
              <div>
                <div class="header">${equipment.brand} - ${equipment.model}</div>
                <div class="meta-row">
                  <span class="meta-label">S/N:</span>
                  <span style="font-family: monospace; font-weight: bold;">${equipment.serialNumber}</span>
                </div>
                ${
                  equipment.macAddress
                    ? `
                  <div class="meta-row">
                    <span class="meta-label">MAC:</span>
                    <span style="font-family: monospace;">${equipment.macAddress}</span>
                  </div>
                `
                    : ""
                }
                ${
                  equipment.imei
                    ? `
                  <div class="meta-row">
                    <span class="meta-label">IMEI:</span>
                    <span style="font-family: monospace;">${equipment.imei}</span>
                  </div>
                `
                    : ""
                }
              </div>
              
              <div>
                <div class="barcode-sim">
                  ${Array.from({ length: 45 })
                    .map(
                      () =>
                        `<div class="barcode-bar" style="height: ${
                          Math.random() > 0.4 ? "100" : "60"
                        }%; width: ${Math.random() > 0.6 ? "1.5px" : "0.75px"}"></div>`
                    )
                    .join("")}
                </div>
                <div class="barcode-text">${equipment.serialNumber}</div>
              </div>
            </div>
            
            <div class="qr-side">
              <img class="qr-image" src="${qrUrl}" />
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(equipment.serialNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row items-center gap-6">
      <div className="bg-white p-3.5 rounded-xl shadow-xs border border-slate-200 flex flex-col items-center justify-center shrink-0">
        {qrUrl ? (
          <img src={qrUrl} alt="Equipment QR Code Sticker" className="w-36 h-36" />
        ) : (
          <div className="w-36 h-36 flex items-center justify-center bg-slate-50 text-slate-400">
            <QrIcon className="w-8 h-8 animate-pulse" />
          </div>
        )}
        <div className="text-[10px] font-mono text-slate-400 mt-2">S/N: {equipment.serialNumber}</div>
      </div>

      <div className="flex-1 space-y-4 text-center md:text-left w-full">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold mb-2">
            <Tag className="w-3 h-3" /> สติ๊กเกอร์อุปกรณ์อัจฉริยะ
          </span>
          <h3 className="font-bold text-slate-800 text-lg">
            {equipment.brand} {equipment.model}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            พิมพ์สติ๊กเกอร์เพื่อติดกับตัวเครื่อง สามารถสแกนเพื่อตรวจสอบประวัติการติดตั้ง ซ่อม และข้อมูลประกันได้ทันที
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col gap-1.5 text-xs text-slate-600 font-medium">
          <div className="flex justify-between">
            <span>Serial Number:</span>
            <span className="font-mono text-slate-900 font-bold">{equipment.serialNumber}</span>
          </div>
          {equipment.macAddress && (
            <div className="flex justify-between">
              <span>MAC Address:</span>
              <span className="font-mono text-slate-900">{equipment.macAddress}</span>
            </div>
          )}
          {equipment.imei && (
            <div className="flex justify-between">
              <span>IMEI:</span>
              <span className="font-mono text-slate-900">{equipment.imei}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center gap-1.5 justify-center flex-1 sm:flex-none cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> พิมพ์สติ๊กเกอร์ (พิมพ์ 80x50mm)
          </button>

          <button
            onClick={handleCopyCode}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 justify-center flex-1 sm:flex-none cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" /> คัดลอก S/N แล้ว
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> คัดลอก Serial S/N
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
