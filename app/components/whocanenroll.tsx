"use client";
import React from "react";

export default function WhoCanEnroll() {
  return (
    <section
      id="who-can-enroll"
      className="py-16 px-8 lg:px-12 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900"
    >
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl lg:text-5xl font-black mb-8 text-center">
          Who Can Enroll?
        </h2>
        <div className="bg-yellow-400 rounded-2xl p-10 shadow-xl relative">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Qualifications
          </h3>
          <ul className="space-y-4 text-lg leading-relaxed text-gray-800">
            <li>
              • A Filipino citizen and at least 23 years old as supported by PSA
              birth certificate;
            </li>
            <li>
              • Employed for an aggregate period of at least five (5) years in
              the industry, related to the academic degree or discipline, where
              equivalency of learning is being sought; and
            </li>
            <li>
              • Possess a high school diploma or a Philippine Educational
              Placement Test (PEPT)/Alternative Learning System certification
              stating “qualified to enter first year college.”
            </li>
          </ul>
          <div className="absolute top-6 right-6 bg-white text-yellow-600 font-bold rounded-full w-8 h-8 flex items-center justify-center shadow">
            !
          </div>
        </div>
      </div>
    </section>
  );
}
