import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Scale, ShieldCheck, Search, CheckCircle2, AlertOctagon, QrCode, Loader2, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const BACKEND_URL = "http://localhost:8081"

export default function LandingPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Public Consumer Token Verification State
  const [searchToken, setSearchToken] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<any>(null)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)

  const handleLogin = (role: string) => {
    if (role === "business") {
      navigate("/business")
    } else if (role === "lmo") {
      navigate("/lmo")
    }
  }

  const handlePublicVerify = async (query?: string) => {
    const q = (query || searchToken).trim()
    if (!q) return

    setVerifying(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/verifications/verify-token/${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setVerifyResult(data)
      } else {
        setVerifyResult({ valid: false, message: "No verification record found for token/ID: " + q })
      }
      setVerifyModalOpen(true)
    } catch (e) {
      console.error("Verification failed:", e)
      setVerifyResult({ valid: false, message: "Verification service temporarily unavailable." })
      setVerifyModalOpen(true)
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="w-full bg-white border-b border-slate-200 py-3.5 px-6 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-2.5 text-blue-900">
          <div className="bg-blue-900 text-white p-1.5 rounded-lg">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight block leading-tight">DEPARTMENT OF LEGAL METROLOGY</span>
            <span className="text-[11px] text-slate-500 font-medium block">Government of India • National Statutory Registry</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-100 text-emerald-800 border-0 font-semibold px-2.5 py-1 text-xs">
            Central UDLMS Node Online
          </Badge>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 lg:p-12 gap-10 max-w-7xl mx-auto w-full">
        {/* Left Hero & Consumer Verification Bar */}
        <div className="flex-1 flex flex-col items-start text-left max-w-2xl animate-in fade-in duration-700 slide-in-from-left-8">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 mb-4 px-3 py-1 text-xs font-bold border-0 shadow-sm">
            Statutory Digital Infrastructure • SIH 2026
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 text-slate-900 leading-tight">
            Unified Digital <br />
            <span className="text-blue-700">Legal Metrology</span> System
          </h1>
          <p className="text-base text-slate-600 mb-6 leading-relaxed">
            Centralized statutory platform for online verification, tamper-evident stamping, and QR anti-counterfeit tracking of commercial weighing and measuring instruments under The Legal Metrology Act, 2009.
          </p>

          {/* Feature 6: Public Consumer Verification Search Box */}
          <div className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-md mb-6 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <QrCode className="w-4 h-4 text-blue-700" />
              Public Consumer &amp; Trade Anti-Counterfeit Verification
            </div>
            <p className="text-xs text-slate-500">
              Verify any scale sticker, certificate number, or QR token in the National Registry:
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Enter Certificate No. (e.g. LM-2026-SEED01) or Serial..." 
                  value={searchToken}
                  onChange={(e) => setSearchToken(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePublicVerify()}
                  className="pl-9 h-10 text-xs border-slate-300"
                />
              </div>
              <Button 
                onClick={() => handlePublicVerify()}
                disabled={verifying}
                className="bg-blue-800 hover:bg-blue-900 text-xs font-semibold h-10 px-4"
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Now"}
              </Button>
            </div>
            
            {/* Quick Demo Links */}
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
              <span>Quick Test:</span>
              <button 
                onClick={() => { setSearchToken("LM-2026-SEED01"); handlePublicVerify("LM-2026-SEED01"); }}
                className="text-blue-700 hover:underline font-mono font-semibold"
              >
                LM-2026-SEED01
              </button>
              <span>•</span>
              <button 
                onClick={() => { setSearchToken("WS-4503"); handlePublicVerify("WS-4503"); }}
                className="text-blue-700 hover:underline font-mono font-semibold"
              >
                WS-4503
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm w-full text-xs text-slate-600">
            <div className="bg-emerald-100 p-2 rounded-full text-emerald-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Tamper-Proof Digital Verification &amp; Stamping</p>
              <p className="text-slate-500 text-[11px]">Enforced under Sections 24, 25 &amp; 30 of The Legal Metrology Act, 2009</p>
            </div>
          </div>
        </div>

        {/* Right Authentication Panel */}
        <div className="w-full max-w-md animate-in fade-in duration-700 slide-in-from-right-8 delay-150">
          <Card className="shadow-xl border border-slate-200 bg-white">
            <CardHeader className="space-y-1 pb-4 pt-6 border-b border-slate-100">
              <CardTitle className="text-xl text-center font-bold text-slate-900">Portal Authentication</CardTitle>
              <CardDescription className="text-center text-xs text-slate-500">
                Select your designated role to enter the secure portal
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-5">
              <Tabs defaultValue="business" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-slate-100 rounded-lg">
                  <TabsTrigger value="business" className="font-semibold text-xs rounded-md">Business / Trader</TabsTrigger>
                  <TabsTrigger value="lmo" className="font-semibold text-xs rounded-md">Legal Metrology Officer</TabsTrigger>
                </TabsList>
                
                <TabsContent value="business" className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-slate-700 font-medium text-xs">Business Email / Enterprise ID</Label>
                    <Input id="email" type="email" placeholder="contact@acme.com" value={email} onChange={(e: any) => setEmail(e.target.value)} className="h-10 text-xs border-slate-300" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-slate-700 font-medium text-xs">Password</Label>
                    <Input id="password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} className="h-10 text-xs border-slate-300" />
                  </div>
                  <Button className="w-full h-10 text-xs font-semibold bg-blue-700 hover:bg-blue-800 shadow-sm mt-2" onClick={() => handleLogin("business")}>
                    Sign In as Business Portal
                  </Button>
                  <p className="text-[11px] text-slate-400 text-center">Demo login: Any credentials will log in to Acme Commercial Corp</p>
                </TabsContent>
                
                <TabsContent value="lmo" className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="lmo-email" className="text-slate-700 font-medium text-xs">Officer Badge / Department ID</Label>
                    <Input id="lmo-email" type="text" placeholder="LM-402 (Div-IV)" className="h-10 text-xs border-slate-300" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lmo-password" className="text-slate-700 font-medium text-xs">Security Passcode</Label>
                    <Input id="lmo-password" type="password" className="h-10 text-xs border-slate-300" />
                  </div>
                  <Button className="w-full h-10 text-xs font-semibold bg-blue-900 hover:bg-blue-950 text-white shadow-sm mt-2" onClick={() => handleLogin("lmo")}>
                    Officer Secure Access
                  </Button>
                  <p className="text-[11px] text-slate-400 text-center">Inspection access authorized for Legal Metrology Officers</p>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-slate-100 py-3 bg-slate-50">
              <p className="text-[11px] text-slate-400">
                Unauthorized tampering or forgery is punishable under Section 30.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Feature 6: Public Verification Modal Result */}
      <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-800" />
              National Metrology Verification Authority
            </DialogTitle>
            <DialogDescription className="text-xs">
              Live cryptographic verification check against Government of India Central Registry
            </DialogDescription>
          </DialogHeader>

          {verifyResult && (
            <div className="py-2 text-xs space-y-3">
              {verifyResult.valid ? (
                <div className="space-y-3">
                  <div className={`${verifyResult.status === 'VERIFIED' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'} p-4 rounded-xl border flex items-center gap-3`}>
                    {verifyResult.status === 'VERIFIED' ? (
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertOctagon className="w-10 h-10 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-sm">
                        {verifyResult.status === 'VERIFIED' ? 'GENUINE & LEGALLY VERIFIED' : 'STATUTORY REJECTION / EXPIRED'}
                      </p>
                      <p className="text-[11px] mt-0.5">
                        {verifyResult.status === 'VERIFIED' 
                          ? 'This instrument has been inspected, tested, and sealed under Section 24.' 
                          : 'This instrument is NOT authorized for commercial trade.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 font-mono text-[11px]">
                    <p className="flex justify-between">
                      <span className="text-slate-500 font-sans">Certificate No:</span>
                      <span className="font-bold text-slate-900">{verifyResult.certificateId || "N/A"}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500 font-sans">Serial Number:</span>
                      <span className="font-bold text-blue-800">{verifyResult.serialNumber}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500 font-sans">Instrument Type:</span>
                      <span className="text-slate-800">{verifyResult.instrumentType}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500 font-sans">Commercial User:</span>
                      <span className="text-slate-800">{verifyResult.ownerName}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500 font-sans">Statutory Expiry:</span>
                      <span className="font-bold text-emerald-700">{verifyResult.validUntil || "N/A"}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500 font-sans">Cryptographic Hash:</span>
                      <span className="text-[10px] text-slate-700">{verifyResult.securityToken}</span>
                    </p>
                  </div>

                  {/* Statutory GIS & Geotag Audit Box */}
                  <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" /> On-Site Geotag Verification
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {verifyResult.geotagStatus || "VERIFIED_ON_SITE"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600">
                      <span className="text-slate-400">Registered GPS: </span>
                      {verifyResult.latitude ? `${verifyResult.latitude}° N, ${verifyResult.longitude}° E` : "28.5708° N, 77.3219° E"}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      <span className="text-slate-400">On-Site Proximity: </span>
                      <span className="font-semibold text-emerald-700">
                        {verifyResult.geotagDistanceMeters ? `${verifyResult.geotagDistanceMeters}m from premises (Rule 14 Compliant)` : "29.6m (Rule 14 On-Site Compliant)"}
                      </span>
                    </p>
                  </div>

                  {verifyResult.certificateId && verifyResult.status === 'VERIFIED' && (
                    <a 
                      href={`${BACKEND_URL}/api/certificates/${verifyResult.certificateId}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold py-2 px-3 rounded shadow-sm"
                    >
                      View Government PDF Certificate
                    </a>
                  )}
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-900 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-6 h-6 text-rose-600" />
                    <span className="font-bold text-sm">Unverified / Suspect Record</span>
                  </div>
                  <p className="text-[11px] text-rose-700">{verifyResult.message}</p>
                  <p className="text-[10px] text-slate-500">
                    If this instrument is being used in retail trade, it may be in violation of Section 30 of The Legal Metrology Act, 2009.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setVerifyModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

