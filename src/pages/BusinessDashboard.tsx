import { useState, useEffect } from "react"
import { 
  Plus, Search, LogOut, CheckCircle2, Clock, AlertTriangle, FileText, 
  Upload, Loader2, Download, Building2, MapPin, Sparkles, Image as ImageIcon, 
  History, AlertOctagon, RotateCcw
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Instrument {
  id: number
  serialNumber: string
  instrumentType: string
  ownerName?: string
  capacity?: string
  location?: string
  documentUrl?: string
  status: string
  errorMargin?: number
  certificateId?: string
  verifiedOn?: string
  validUntil?: string
  rejectionReason?: string
  inspectionNotes?: string
  stampingFee?: number
  latitude?: number
  longitude?: number
  geoZone?: string
  inspectorLatitude?: number
  inspectorLongitude?: number
  geotagStatus?: string
  geotagDistanceMeters?: number
}

interface AuditLog {
  id: number
  instrumentId: number
  serialNumber: string
  action: string
  performedBy: string
  timestamp: string
  details: string
}

const BACKEND_URL = "http://localhost:8081"

export default function BusinessDashboard() {
  const navigate = useNavigate()
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [loading, setLoading] = useState(true)
  const [isNewAppOpen, setIsNewAppOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Form states for new application
  const [instrumentType, setInstrumentType] = useState("Digital Weighing Scale")
  const [serialNumber, setSerialNumber] = useState("")
  const [capacity, setCapacity] = useState("50kg")
  const [location, setLocation] = useState("Warehouse A, Sector 62")
  const [latitude, setLatitude] = useState("28.6280")
  const [longitude, setLongitude] = useState("77.3649")
  const [geoZone, setGeoZone] = useState("Zone A - Sector 62 Industrial Hub")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)

  const autoDetectGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(4))
          setLongitude(pos.coords.longitude.toFixed(4))
          setGeoZone("Zone B - Sector 18 Commercial District")
        },
        () => {
          setLatitude("28.5708")
          setLongitude("77.3219")
          setGeoZone("Zone B - Sector 18 Commercial District")
        }
      )
    } else {
      setLatitude("28.5708")
      setLongitude("77.3219")
      setGeoZone("Zone B - Sector 18 Commercial District")
    }
  }

  // Audit trail state
  const [auditOpen, setAuditOpen] = useState(false)
  const [auditInstrument, setAuditInstrument] = useState<Instrument | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditLoading, setAuditLoading] = useState(false)

  const fetchInstruments = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${BACKEND_URL}/api/instruments`)
      if (res.ok) {
        const data = await res.json()
        setInstruments(data)
      }
    } catch (err) {
      console.error("Backend fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstruments()
  }, [])

  const handleLogout = () => {
    navigate("/")
  }

  // Handle Photo / Document selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Submit new application to PostgreSQL via Spring Boot
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serialNumber.trim()) {
      alert("Please enter Instrument Serial Number.")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        instrumentType,
        serialNumber: serialNumber.trim(),
        capacity,
        location,
        latitude: parseFloat(latitude) || 28.6280,
        longitude: parseFloat(longitude) || 77.3649,
        geoZone,
        ownerName: "Acme Commercial Corp",
        documentUrl: imagePreview || null,
        status: "PENDING_VERIFICATION",
      }

      const res = await fetch(`${BACKEND_URL}/api/instruments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setSuccessBanner(`Application for '${serialNumber}' submitted! Forwarded to Legal Metrology Officer queue for verification.`)
        setIsNewAppOpen(false)
        setSerialNumber("")
        setImagePreview(null)
        await fetchInstruments()

        setTimeout(() => setSuccessBanner(null), 6000)
      } else {
        alert("Failed to submit application. Please check backend port 8081.")
      }
    } catch (err) {
      console.error("Submit error:", err)
      alert("Error connecting to Spring Boot Backend.")
    } finally {
      setSubmitting(false)
    }
  }

  // Apply for Re-Verification / Renewal / Rectification
  const handleApplyRenewal = async (id: number, serial: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/instruments/${id}/apply`, {
        method: "POST"
      })
      if (res.ok) {
        setSuccessBanner(`Re-verification request for instrument '${serial}' submitted to Legal Metrology Officer queue.`)
        await fetchInstruments()
        setTimeout(() => setSuccessBanner(null), 6000)
      }
    } catch (err) {
      console.error("Renewal application failed:", err)
    }
  }

  // View immutable audit trail
  const handleViewAudit = async (inst: Instrument) => {
    setAuditInstrument(inst)
    setAuditOpen(true)
    setAuditLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/verifications/${inst.id}/audit-trail`)
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data)
      }
    } catch (e) {
      console.error("Failed to fetch audit trail:", e)
    } finally {
      setAuditLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0 font-bold"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</Badge>
      case "EXPIRING_SOON":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0 font-bold"><AlertTriangle className="w-3 h-3 mr-1" /> Expiring Soon</Badge>
      case "PENDING_VERIFICATION":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-0 font-medium"><Clock className="w-3 h-3 mr-1" /> Under Inspection</Badge>
      case "REJECTED":
        return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 border-0 font-bold"><AlertOctagon className="w-3 h-3 mr-1" /> Form VII Rejected</Badge>
      case "EXPIRED":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-0 font-bold"><AlertTriangle className="w-3 h-3 mr-1" /> Expired</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filtered = instruments.filter(inst => 
    inst.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.instrumentType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const verifiedCount = instruments.filter(i => i.status === "VERIFIED" || i.status === "EXPIRING_SOON").length
  const pendingCount = instruments.filter(i => i.status === "PENDING_VERIFICATION").length
  const rejectedCount = instruments.filter(i => i.status === "REJECTED").length

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-blue-800 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded">
              <FileText className="w-6 h-6 text-blue-800" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-wide block leading-tight">UDLMS | Business Portal</span>
              <span className="text-[11px] text-blue-200 block">Ministry of Consumer Affairs, Food &amp; Public Distribution</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium hidden md:flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-200" /> Acme Commercial Corp
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-blue-100 hover:text-white hover:bg-blue-700">
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-500">
        {successBanner && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 text-emerald-900 shadow-sm animate-in slide-in-from-top-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Application Status Updated</p>
              <p className="text-sm text-emerald-700">{successBanner}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Commercial Instruments Portfolio</h1>
            <p className="text-slate-500 mt-1">Manage statutory verification certificates, renewal deadlines, and inspection filings.</p>
          </div>
          
          <Dialog open={isNewAppOpen} onOpenChange={setIsNewAppOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-blue-700 hover:bg-blue-800 font-semibold shadow-sm">
                <Plus className="w-5 h-5 mr-2" /> Apply for Instrument Verification
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  New Verification Application
                </DialogTitle>
                <DialogDescription>
                  Upload scale photo &amp; details. This application will appear in the Legal Metrology Officer's verification queue.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmitApplication} className="space-y-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="type">Instrument Type / Category</Label>
                  <select
                    id="type"
                    value={instrumentType}
                    onChange={(e) => setInstrumentType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <option>Digital Weighing Scale</option>
                    <option>Platform Scale</option>
                    <option>Electronic Weighbridge</option>
                    <option>Fuel Dispenser Unit</option>
                    <option>Counter Scale (Class III)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="serial">Serial Number / Machine ID *</Label>
                    <Input
                      id="serial"
                      placeholder="e.g. WS-4503, SN-9982"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="capacity">Max Capacity / Spec</Label>
                    <Input
                      id="capacity"
                      placeholder="e.g. 50kg, 100kg, 500kg"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Physical Installation Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g. Shop #4, Sector 18, Commercial Market"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                {/* GIS & Geotag Establishment Location */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" /> Statutory Business Premises GPS Coordinates
                    </Label>
                    <button
                      type="button"
                      onClick={autoDetectGps}
                      className="text-[11px] text-blue-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      📍 Auto-Detect GPS
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Latitude (°N)</span>
                      <Input
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="28.6280"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Longitude (°E)</span>
                      <Input
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="77.3649"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Enforcement Jurisdiction Zone</span>
                    <select
                      value={geoZone}
                      onChange={(e) => setGeoZone(e.target.value)}
                      className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option>Zone A - Sector 62 Industrial Hub</option>
                      <option>Zone B - Sector 18 Commercial District</option>
                      <option>Zone C - Highway 14 Freight Corridor</option>
                      <option>Zone D - Industrial Estate Yard</option>
                    </select>
                  </div>
                </div>

                {/* Photo & Document Upload */}
                <div className="grid gap-2">
                  <Label>Scale Display Photo / Purchase Invoice *</Label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 transition-colors">
                    {imagePreview ? (
                      <div className="text-center space-y-2">
                        <img src={imagePreview} alt="Scale Upload" className="max-h-36 rounded-lg shadow-sm mx-auto object-contain" />
                        <label className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer block">
                          <input type="file" className="hidden" accept="image/*" onChange={handlePhotoSelect} />
                          Change Photo
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer w-full py-2">
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoSelect} />
                        <Upload className="w-8 h-8 text-blue-600 mb-1" />
                        <span className="text-sm font-semibold text-slate-800">Click to upload scale display image</span>
                        <span className="text-xs text-slate-500 mt-0.5">Officer will run AI OCR verification on this image</span>
                      </label>
                    )}
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsNewAppOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-blue-700 hover:bg-blue-800" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Submitting to Officer...
                      </>
                    ) : (
                      "Submit Application to Officer"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription className="font-medium text-slate-500">Registered Instruments</CardDescription>
              <CardTitle className="text-3xl text-slate-900">{instruments.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription className="font-medium text-slate-500">Under Inspection</CardDescription>
              <CardTitle className="text-3xl text-amber-600">{pendingCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription className="font-medium text-slate-500">Legally Certified</CardDescription>
              <CardTitle className="text-3xl text-emerald-600">{verifiedCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription className="font-medium text-slate-500">Non-Compliant / Rejected</CardDescription>
              <CardTitle className="text-3xl text-rose-600">{rejectedCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="shadow-sm border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <CardTitle className="text-xl font-bold text-slate-800">Instruments &amp; Verification Status</CardTitle>
              <CardDescription className="text-slate-500 font-medium mt-1">Live database records from National Legal Metrology Registry.</CardDescription>
            </div>
            <div className="relative w-64 hidden sm:block">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                type="search" 
                placeholder="Search Serial No..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200 shadow-sm" 
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-8 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading instruments from PostgreSQL...
              </div>
            ) : instruments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p>No instruments registered yet. Click "Apply for Instrument Verification" to start.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[140px] font-semibold text-slate-600">Instrument Serial</TableHead>
                    <TableHead className="font-semibold text-slate-600">Type / Category</TableHead>
                    <TableHead className="font-semibold text-slate-600">Location</TableHead>
                    <TableHead className="font-semibold text-slate-600">Status &amp; Validity</TableHead>
                    <TableHead className="font-semibold text-slate-600">Audit History</TableHead>
                    <TableHead className="text-right font-semibold text-slate-600 pr-6">Statutory Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inst) => (
                    <TableRow key={inst.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                      <TableCell className="font-bold text-blue-700">
                        {inst.serialNumber}
                        {inst.capacity && <span className="block text-xs text-slate-500 font-normal">Cap: {inst.capacity}</span>}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {inst.instrumentType}
                        {inst.documentUrl && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 mt-0.5 block">
                            <ImageIcon className="w-3 h-3" /> Photo Attached
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        <span className="flex items-center gap-1 font-medium text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" /> {inst.location || "Commercial Facility"}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 block mt-0.5">
                          📍 {inst.latitude ? `${inst.latitude.toFixed(4)}° N, ${inst.longitude?.toFixed(4)}° E` : "28.5708° N, 77.3219° E"}
                        </span>
                        {inst.geotagStatus && (
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${inst.geotagStatus === 'VERIFIED_ON_SITE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            🛡️ {inst.geotagStatus} ({inst.geotagDistanceMeters ?? '29.6'}m)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          {getStatusBadge(inst.status)}
                          {inst.validUntil && (
                            <span className="block text-[11px] text-slate-500 mt-1">
                              Expires: {inst.validUntil}
                            </span>
                          )}
                          {inst.rejectionReason && (
                            <span className="block text-[11px] text-rose-700 font-medium mt-0.5">
                              {inst.rejectionReason}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewAudit(inst)}
                          className="text-xs text-slate-600 hover:text-blue-700"
                        >
                          <History className="w-3.5 h-3.5 mr-1" /> View Trail
                        </Button>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {inst.status === "VERIFIED" && inst.certificateId && (
                            <a 
                              href={`${BACKEND_URL}/api/certificates/${inst.certificateId}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 px-3 rounded shadow-sm transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" /> PDF Certificate
                            </a>
                          )}

                          {inst.status === "REJECTED" && (
                            <>
                              <a 
                                href={`${BACKEND_URL}/api/certificates/${inst.id}/rejection-pdf`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold py-1.5 px-2.5 rounded shadow-sm"
                              >
                                <Download className="w-3 h-3" /> Form VII Notice
                              </a>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApplyRenewal(inst.id, inst.serialNumber)}
                                className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                              >
                                <RotateCcw className="w-3 h-3 mr-1" /> Re-apply
                              </Button>
                            </>
                          )}

                          {(inst.status === "EXPIRING_SOON" || inst.status === "EXPIRED") && (
                            <Button
                              size="sm"
                              onClick={() => handleApplyRenewal(inst.id, inst.serialNumber)}
                              className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" /> Renew Certificate
                            </Button>
                          )}

                          {inst.status === "PENDING_VERIFICATION" && (
                            <span className="text-xs text-slate-400 italic">Queue Assigned to Officer</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Audit Trail Modal */}
      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <History className="w-5 h-5 text-blue-700" />
              Statutory Custody &amp; Verification Trail
            </DialogTitle>
            <DialogDescription className="text-xs">
              Instrument: <span className="font-mono font-bold text-slate-900">{auditInstrument?.serialNumber}</span> ({auditInstrument?.instrumentType})
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 max-h-[60vh] overflow-y-auto space-y-2">
            {auditLoading ? (
              <div className="flex items-center justify-center p-8 text-slate-500 text-xs">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading audit history...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center p-6 text-slate-400 text-xs">
                No inspection audit records found.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="font-mono text-[10px] bg-white font-bold text-blue-800">
                      {log.action}
                    </Badge>
                    <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-700 font-medium">{log.details}</p>
                  <p className="text-[10px] text-slate-500">By: <span className="font-semibold text-slate-600">{log.performedBy}</span></p>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAuditOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

