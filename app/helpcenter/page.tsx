"use client";
import React, { useState } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import { supabase } from "@/lib/supabase";

export default function Page() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? null;

      const { error: insertError } = await supabase
        .from("support_tickets")
        .insert([{
          user_id: userId,
          user_name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }]);

      if (insertError) {
        alert(`Failed to save ticket: ${insertError.message}`);
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: "qjcnjimenez@tip.edu.ph",
          subject: `Support Ticket: ${formData.subject}`,
          body: `
Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message:
${formData.message}
          `,
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        alert("Ticket saved, but email response was invalid.");
        setSubmitting(false);
        return;
      }

      if (res.ok) {
        alert("Your support ticket has been submitted successfully! Our team will review your concern and get back to you at your provided email address. Thank you for reaching out!");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        alert(`Ticket saved, but failed to send email: ${data?.error || "Unknown error"}`);
      }

    } catch (err) {
      console.error(err);
      alert("An error occurred while submitting your ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />

      <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 sm:pb-16 max-w-4xl mx-auto">

        {/* PAGE TITLE */}
        <div className="mb-8 sm:mb-12 text-center px-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Help Center
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Need assistance? Browse common questions or submit a support ticket and our team will get back to you.
          </p>
        </div>

        {/* FAQ SECTION */}
        <section className="mb-10 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800">
            Frequently Asked Questions
          </h2>

          <div className="space-y-3 sm:space-y-4">
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md">
              <h3 className="font-semibold mb-1 sm:mb-2 text-gray-900 text-sm sm:text-base">
                How do I submit an application?
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                You can submit your application through the Application section on the homepage.
              </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md">
              <h3 className="font-semibold mb-1 sm:mb-2 text-gray-900 text-sm sm:text-base">
                Who is eligible to enroll?
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Please refer to the "Who Can Enroll" section on the homepage for full eligibility details.
              </p>
            </div>
          </div>
        </section>

        {/* SUPPORT FORM */}
        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800">
            Submit a Support Ticket
          </h2>

          <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">

              {/* NAME & EMAIL — side by side on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 sm:mb-2 font-medium text-gray-700 text-sm sm:text-base">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border text-black border-gray-300 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 sm:mb-2 font-medium text-gray-700 text-sm sm:text-base">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full border text-black border-gray-300 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* SUBJECT */}
              <div>
                <label className="block mb-1.5 sm:mb-2 font-medium text-gray-700 text-sm sm:text-base">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full border text-black border-gray-300 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  placeholder="Briefly describe your concern"
                />
              </div>

              {/* MESSAGE */}
              <div>
                <label className="block mb-1.5 sm:mb-2 font-medium text-gray-700 text-sm sm:text-base">
                  Describe Your Concern
                </label>
                <textarea
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full border text-black border-gray-300 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-yellow-400 focus:outline-none resize-none"
                  placeholder="Provide detailed information about your concern..."
                />
              </div>

              {/* SUBMIT — full width on mobile, right-aligned on sm+ */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto bg-yellow-400 text-black font-semibold px-6 py-3 rounded-xl hover:bg-yellow-300 active:bg-yellow-500 transition shadow-md disabled:opacity-50 text-sm sm:text-base"
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>

            </form>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}