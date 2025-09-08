"use client";
import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-10">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Logo and Address */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/assets/TIPLogo.png"
                alt="TIP Logo"
                className="w-12 h-12 object-contain"
              />
              <h2 className="text-lg font-bold uppercase">
                TECHNOLOGICAL INSTITUTE OF THE PHILIPPINES
              </h2>
            </div>
            <p className="text-sm leading-relaxed">
              363 P. Casal St., Quiapo, Manila <br />
              1338 Arlegui St., Quiapo, Manila <br />
              Tel. No: (02) 8733-9117 / (02) 7918-8476 / 0917-177-2566
            </p>
            <p className="text-sm leading-relaxed mt-4">
              938 Aurora Boulevard, Cubao, Quezon City <br />
              Tel. No: (02) 8911-0964 / (02) 7917-8477 / 0917-177-2556
            </p>
            <p className="text-sm mt-4">
              <span className="font-semibold">E-mail:</span> info@tip.edu.ph
            </p>
          </div>

          {/* Student Services */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Student Services</h3>
            <ul className="space-y-2 text-sm">
              <li>Canvas</li>
              <li>Library</li>
              <li>Career Center</li>
              <li>T.I.P. Email</li>
              <li>ARIS</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>About T.I.P.</li>
              <li>FAQs</li>
              <li>Admission</li>
              <li>Careers at T.I.P.</li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="hover:opacity-75">
                <img
                  src="/assets/fblogo.png"
                  alt="Facebook"
                  className="w-6 h-6"
                />
              </a>
              <a href="#" className="hover:opacity-75">
                <img
                  src="/assets/xlogo.webp"
                  alt="Twitter"
                  className="w-6 h-6"
                />
              </a>
              <a href="#" className="hover:opacity-75">
                <img
                  src="/assets/iglogo.avif"
                  alt="Instagram"
                  className="w-6 h-6"
                />
              </a>
              <a href="#" className="hover:opacity-75">
                <img
                  src="/assets/ytlogo.webp"
                  alt="YouTube"
                  className="w-6 h-6"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="text-center text-xs text-gray-400 mt-10">
          © {new Date().getFullYear()} Technological Institute of the
          Philippines. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
