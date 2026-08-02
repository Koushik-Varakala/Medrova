import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy | Medrova",
  description: "Refund and cancellation policy for Medrova.",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12">
        <h1 className="text-3xl font-black text-[#0F172A] mb-8">Refund and Cancellation Policy</h1>
        
        <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
          <p>
            Upon completing a Transaction, you are entering into a legally binding and enforceable agreement with us to purchase the product and/or service. After this point the User may cancel the Transaction unless it has been specifically provided for on the Platform. In which case, the cancellation will be subject to the terms mentioned on the Platform.
          </p>
          
          <p>
            We shall retain the discretion in approving any cancellation requests and we may ask for additional details before approving any requests. Once you have received the product and/or service, the only event where you can request for a replacement or a return and a refund is if the product and/or service does not match the description as mentioned on the Platform.
          </p>

          <p>
            Any request for refund must be submitted within three days from the date of the Transaction or such number of days prescribed on the Platform, which shall in no event be less than three days.
          </p>

          <p>
            A User may submit a claim for a refund for a purchase made, by contacting us on <strong>seller+ba8f927128444c02982a0d7d5cd56dca@instamojo.com</strong> or at <strong>koushik@medrova.in</strong> and providing a clear and specific reason for the refund request, including the exact terms that have been violated, along with any proof, if required. 
          </p>

          <p>
            Whether a refund will be provided will be determined by us, and we may ask for additional details before approving any requests.
          </p>
        </div>
      </div>
    </div>
  );
}
