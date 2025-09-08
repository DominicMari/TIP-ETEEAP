"use client";
import React from "react";

export default function Assessment() {
  return (
    <section
      id="assessment"
      className="py-16 px-8 lg:px-12 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-900"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl lg:text-5xl font-black mb-12 text-center">
          Assessment Procedure & Admission Requirements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Assessment Procedure */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-yellow-400 px-6 py-4">
              <h3 className="text-xl font-bold text-gray-900 text-center">
                Assessment Procedure
              </h3>
            </div>
            <div className="p-8">
              <ul className="space-y-4 text-lg text-gray-700 leading-relaxed list-disc list-inside">
                <li>
                  The applicant submits the accomplished application form and
                  supporting documents.
                </li>
                <li>
                  An ETEEAP staff checks and evaluates the completeness of the
                  submitted documents.
                </li>
                <li>
                  The staff turns over the applicant’s credentials to the
                  assessors for further evaluation.
                </li>
                <li>
                  The Chair and Dean endorse the competency evaluation results
                  and certificate of competency to the ETEEAP Head.
                </li>
                <li>
                  The ETEEAP Head recommends the competency evaluation results
                  and certificate of competency to the Vice President for
                  Academic Affairs (VPAA).
                </li>
                <li>
                  The VPAA approves the competency evaluation results and
                  certificate of competency.
                </li>
                <li>
                  The applicant complies with the recommended enrichment
                  courses/learning packages.
                </li>
                <li>
                  The assessor submits the evaluation results with a certificate
                  of competency noted by the Chair and Dean.
                </li>
              </ul>
            </div>
          </div>

          {/* Admission Requirements */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gray-800 px-6 py-4">
              <h3 className="text-xl font-bold text-white text-center">
                Admission Requirements
              </h3>
            </div>
            <div className="p-8">
              <ul className="space-y-4 text-lg text-gray-700 leading-relaxed list-disc list-inside">
                <li>
                  Accomplished ETEEAP application and preliminary assessment
                  forms with recent 1x1 ID picture and supporting documents,
                  training certificates, recognitions, awards, etc.
                </li>
                <li>
                  School credentials: Transcript of Records, Diploma, Form
                  137/138
                </li>
                <li>Comprehensive curriculum vitae</li>
                <li>
                  Statement of ownership/authenticity of
                  credentials/supporting documents
                </li>
                <li>
                  Endorsement letter from the last, or the current employer
                </li>
                <li>
                  Other documents (PSA birth certificate, barangay
                  clearance/NBI clearance/passport, marriage certificate [for
                  married woman])
                </li>
                <li>
                  Provide proof/evidence to support/demonstrate compliance with
                  the General and Program Criteria of ABET EAC (CpE & IE) and
                  ABET CAC (CS & IT) Requirements, and all other
                  accreditation/assessment requirements, that shall be discussed
                  during the Application Process.
                </li>
                <li>
                  Other evidences to support capability and knowledge in the
                  field for equivalency and accreditation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
