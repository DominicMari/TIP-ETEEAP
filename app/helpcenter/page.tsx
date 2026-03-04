"use client";
import React, { useState } from "react";
import Header from "../components/header";
import Footer from "../components/footer";

export default function Page() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Ticket submitted successfully!");
    setFormData({
      name: "",
      email: "",
      category: "",
      message: "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-4 pt-28 pb-16">

        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Help Center
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Need assistance? Browse common questions or submit a support ticket and our team will get back to you.
          </p>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="font-semibold mb-2 text-gray-900">
                How do I submit an application?
              </h3>
              <p className="text-gray-600">
                You can submit your application through the Application section on the homepage.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h3 className="font-semibold mb-2 text-gray-900">
                Who is eligible to enroll?
              </h3>
              <p className="text-gray-600">
                Please refer to the "Who Can Enroll" section on the homepage for full eligibility details.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Submit a Support Ticket
          </h2>

          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border text-black border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full border text-black border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Concern Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full border text-black border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                >
                  <option value="">Select a category</option>
                  <option value="application">Application Issue</option>
                  <option value="technical">Technical Problem</option>
                  <option value="account">Account Concern</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Describe Your Concern
                </label>
                <textarea
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full border text-black border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  placeholder="Provide detailed information about your concern..."
                />
              </div>

              <div className="text-right">
                <button
                  type="submit"
                  className="bg-yellow-400 text-black font-semibold px-6 py-3 rounded-xl hover:bg-yellow-300 transition shadow-md"
                >
                  Submit Ticket
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