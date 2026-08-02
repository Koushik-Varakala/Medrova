import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping and Delivery Policy | Medrova",
  description: "Shipping and delivery policy for Medrova.",
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12">
        <h1 className="text-3xl font-black text-[#0F172A] mb-8">Shipping and Delivery Policy</h1>
        
        <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
          <p>
            <em>Note: As Medrova is a digital Software-as-a-Service (SaaS) platform connecting healthcare professionals with facilities, our "shipping" and "delivery" typically refers to the provisioning of digital access, confirmation of shifts, or digital matches.</em>
          </p>
          
          <p>
            You hereby agree that the delivery dates are estimates, unless a fixed date for the delivery has been expressly agreed in writing. The cost for delivery (if applicable) shall be calculated at the time of initiation of Transaction based on the shipping address and will be collected from you as a part of the Transaction Amount paid for the products and/or services.
          </p>

          <p>
            In the event that you do not receive the delivery even after seven days have passed from the estimated date of delivery, you must promptly reach out to us at <strong>seller+ba8f927128444c02982a0d7d5cd56dca@instamojo.com</strong> or our official support email at <strong>koushik@medrova.in</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
