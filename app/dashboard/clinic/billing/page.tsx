"use client";

import { useState } from "react";
import { CreditCard, Check, Zap, BriefcaseMedical, ShieldCheck } from "lucide-react";

export default function ClinicBillingPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Medrova Credit Plans</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Medrova charges zero commission to doctors. Instead, hospitals use Prepaid Credits to confirm shifts. 
          1 Credit unlocks the doctor's contact details and confirms them for your shift.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Tier 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Pay-As-You-Go</h3>
            <p className="text-sm text-slate-500 mt-1">Perfect for one-off emergency shifts</p>
          </div>
          
          <div className="mb-6">
            <span className="text-4xl font-bold text-slate-900">₹750</span>
            <span className="text-slate-500"> / credit</span>
          </div>

          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-slate-600 text-sm">1 Credit included</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-slate-600 text-sm">No monthly commitment</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-slate-600 text-sm">Access to verified doctors</span>
            </li>
          </ul>

          <button 
            onClick={() => setShowModal(true)}
            className="w-full py-3 px-4 bg-white border-2 border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            Buy 1 Credit
          </button>
        </div>

        {/* Tier 2 */}
        <div className="bg-white rounded-2xl border-2 border-blue-600 p-8 shadow-md flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            MOST POPULAR
          </div>

          <div className="mb-6 mt-2">
            <h3 className="text-lg font-semibold text-blue-900">Clinic Plan</h3>
            <p className="text-sm text-slate-500 mt-1">Ideal for small clinics and regular cover</p>
          </div>
          
          <div className="mb-6">
            <span className="text-4xl font-bold text-slate-900">₹2,499</span>
            <span className="text-slate-500"> / 5 credits</span>
            <div className="text-xs text-emerald-600 font-medium mt-2">Save 33% (₹500 per credit)</div>
          </div>

          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-blue-600 shrink-0" />
              <span className="text-slate-700 text-sm font-medium">5 Credits included</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-blue-600 shrink-0" />
              <span className="text-slate-600 text-sm">Credits never expire</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-blue-600 shrink-0" />
              <span className="text-slate-600 text-sm">Priority doctor matching algorithm</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-blue-600 shrink-0" />
              <span className="text-slate-600 text-sm">Email support</span>
            </li>
          </ul>

          <button 
            onClick={() => setShowModal(true)}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" /> Buy 5 Credits
          </button>
        </div>

        {/* Tier 3 */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white">Hospital Pro</h3>
            <p className="text-sm text-slate-400 mt-1">For corporate hospitals & multi-specialty</p>
          </div>
          
          <div className="mb-6">
            <span className="text-4xl font-bold text-white">₹7,999</span>
            <span className="text-slate-400"> / 20 credits</span>
            <div className="text-xs text-emerald-400 font-medium mt-2">Save 47% (₹400 per credit)</div>
          </div>

          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-slate-300 text-sm">20 Credits included</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-slate-300 text-sm">Ability to hire Permanent Doctors (costs 10 credits)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-slate-300 text-sm">Dedicated Account Manager</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-slate-300 text-sm">API Access (Coming Soon)</span>
            </li>
          </ul>

          <button 
            onClick={() => setShowModal(true)}
            className="w-full py-3 px-4 bg-white text-slate-900 font-medium rounded-xl hover:bg-slate-100 transition-colors"
          >
            Buy 20 Credits
          </button>
        </div>
      </div>

      <div className="mt-16 bg-blue-50 rounded-2xl p-8 border border-blue-100 flex items-center gap-8">
        <div className="hidden md:flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full shrink-0">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-blue-900 mb-2">The Medrova Guarantee</h3>
          <p className="text-blue-800/80">
            Unlike traditional agencies that charge a 15-35% markup on every single shift, we charge a flat software fee. 
            <strong> You pay the doctor directly at the clinic. </strong>
            This ensures doctors get 100% of their pay, and you save thousands on staffing costs.
          </p>
        </div>
      </div>

      {/* Temporary Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-xl relative animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Activate Your Credits</h3>
            <p className="text-slate-600 mb-6">
              Automated card payments are temporarily paused while we upgrade our systems. 
              To purchase credits, please contact our support team.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-500 font-medium mb-1">Email us at:</p>
              <a href="mailto:koushik@medrova.in" className="text-blue-600 font-bold hover:underline">
                koushik@medrova.in
              </a>
              <p className="text-sm text-slate-500 font-medium mt-3 mb-1">Or call/WhatsApp:</p>
              <a href="tel:+917799001102" className="text-blue-600 font-bold hover:underline">
                +91 77990 01102
              </a>
            </div>
            <button 
              onClick={() => setShowModal(false)}
              className="w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
