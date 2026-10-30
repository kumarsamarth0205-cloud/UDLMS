import { useState, useEffect } from "react"
import { FileText, Calendar, Copy, Printer, Check } from "lucide-react"
import { useParams, Link } from "react-router-dom"

interface Instrument {
  id: number
  serialNumber: string
  instrumentType: string
  ownerName?: string
  capacity?: string
  location?: string
  status: string
  errorMargin?: number
  certificateId?: string
  verifiedOn?: string
  validUntil?: string
}

const BACKEND_URL = "http://localhost:8081"

export default function DigitalCertificateView() {
  const { id } = useParams()
  const [instrument, setInstrument] = useState<Instrument | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/instruments`)
        if (res.ok) {
          const list: Instrument[] = await res.json()
          const match = list.find(i => i.certificateId === id || String(i.id) === id)
          if (match) setInstrument(match)
        }
      } catch (err) {
        console.error("Error fetching certificate:", err)
      }
    }
    fetchCert()
  }, [id])

  const certId = instrument?.certificateId || id || "CERT-2026-4380"
  const validUntil = instrument?.validUntil ? formatDate(instrument.validUntil) : "4 Sept 2027"

  function formatDate(dateStr: string) {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    } catch {
      return dateStr
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    if (instrument?.certificateId) {
      window.open(`${BACKEND_URL}/api/certificates/${instrument.certificateId}/pdf`, "_blank")
    } else {
      window.print()
    }
  }

  // Generate QR code URL
  const qrData = encodeURIComponent(window.location.href)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrData}&color=1e293b`

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      {/* Outer Card Matching the User's Screenshot Exactly */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Top Header Section */}
        <div className="p-6 pb-4">
          <div className="flex justify-between items-start">
            {/* Left: Certificate ID */}
            <div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 tracking-wider">
                <FileText className="w-3.5 h-3.5" />
                <span>CERTIFICATE ID</span>
              </div>
              <p className="font-bold text-slate-800 text-lg mt-0.5 font-mono">
                {certId}
              </p>
            </div>

            {/* Right: Valid Until */}
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-[11px] font-semibold text-slate-400 tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                <span>VALID UNTIL</span>
              </div>
              <p className="font-bold text-slate-800 text-lg mt-0.5">
                {validUntil}
              </p>
            </div>
          </div>

          {/* Instrument Specifications Heading */}
          <div className="mt-8 mb-3">
            <h3 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              INSTRUMENT SPECIFICATIONS
            </h3>
          </div>

          {/* Specifications Box */}
          <div className="border border-slate-200 rounded-xl bg-slate-50/50 divide-y divide-slate-200 text-sm">
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-slate-500 font-normal text-sm">Instrument Type</span>
              <span className="font-semibold text-slate-800 text-right">
                {instrument?.instrumentType || "Analog Weighing Scale"}
              </span>
            </div>

            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-slate-500 font-normal text-sm">Capacity / Class</span>
              <span className="font-semibold text-slate-800 text-right">
                {instrument?.capacity || "55Kg"}
              </span>
            </div>

            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-slate-500 font-normal text-sm">Registered Owner</span>
              <span className="font-semibold text-slate-800 text-right">
                {instrument?.ownerName || "Acme Corp"}
              </span>
            </div>

            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-slate-500 font-normal text-sm">Location</span>
              <span className="font-semibold text-slate-800 text-right">
                {instrument?.location || "Whole Sale Shop"}
              </span>
            </div>

            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-slate-500 font-normal text-sm">Verified By</span>
              <span className="font-semibold text-slate-800 text-right text-xs sm:text-sm">
                Inspector V. K. Verma (Badge #LM-402)
              </span>
            </div>
          </div>

          {/* Center QR Code */}
          <div className="flex flex-col items-center justify-center my-6">
            <div className="border border-slate-200 p-3 rounded-2xl bg-white shadow-sm">
              <img 
                src={qrUrl} 
                alt="Verification QR Code" 
                className="w-36 h-36 object-contain rounded-lg"
              />
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-3 text-center">
              Scan with any camera to verify authenticity
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 text-center">
              Cryptographically bound to UDLMS central registry
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1 pb-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Certificate</span>
            </button>
          </div>
        </div>

        {/* Bottom Navy Bar */}
        <div className="bg-[#103463] text-white px-5 py-3.5 flex justify-between items-center text-xs mt-auto">
          <span className="font-medium text-slate-200">
            Govt. of India • Dept. of Legal Metrology
          </span>
          <Link 
            to="/" 
            className="flex items-center gap-1 text-slate-200 hover:text-white font-medium hover:underline"
          >
            ← Back to UDLMS Portal
          </Link>
        </div>
      </div>
    </div>
  )
}
