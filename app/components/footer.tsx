"use client";
import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Section 1: T.I.P Information */}
          <div className="lg:col-span-2 border-b border-gray-700 pb-8 lg:border-none lg:pb-0">
            <div className="flex items-center gap-4 mb-4">
              <img
                src="/assets/NewTIPLogo.png"
                alt="TIP Logo"
                className="w-14 h-14 object-contain"
              />
              <h2 className="text-lg font-bold uppercase tracking-wide">
                Technological Institute of the Philippines
              </h2>              
            </div>
            <div className="space-y-4 text-sm text-gray-300">
              <p className="leading-relaxed">
                <span className="font-semibold text-white block">Manila Campus:</span>
                363 P. Casal St. & 1338 Arlegui St., Quiapo, Manila
                <br />
                Tel. No: (02) 8733-9117 / (02) 7918-8476
              </p>
              <p className="leading-relaxed">
                <span className="font-semibold text-white block">Quezon City Campus:</span>
                938 Aurora Boulevard, Cubao, Quezon City
                <br />
                Tel. No: (02) 8911-0964 / (02) 7917-8477
              </p>
              <p className="leading-relaxed">
                <span className="font-semibold text-white">Mobile:</span> 0917-177-2566
                <br />
                <span className="font-semibold text-white">E-mail:</span> info@tip.edu.ph
              </p>
            </div>
          </div>

          {/* Section 2: Link Sections Group */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Student Services */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Student Services</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="http://tip.instructure.com/" className="hover:text-white transition-colors">Canvas</a></li>
                <li><a href="https://library.tip.edu.ph/" className="hover:text-white transition-colors">Library</a></li>
                <li><a href="https://tip-careercenter.prosple.com/" className="hover:text-white transition-colors">Career Center</a></li>
                <li><a href="https://canvas.tip.edu.ph/mail.html" className="hover:text-white transition-colors">T.I.P. Email</a></li>
                <li><a href="https://webqc2.tip.edu.ph/portal/aris/index.php" className="hover:text-white transition-colors">ARIS</a></li>
                <li><a href="https://student-mla.tip.edu.ph/login?redirect=%2F" className="hover:text-white transition-colors">EmpowerED - Manila</a></li>
                <li><a href="https://student-qc.tip.edu.ph/login?redirect=%2F" className="hover:text-white transition-colors">EmpowerED - Quezon City</a></li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="https://tip.edu.ph/about-tip/history/" className="hover:text-white transition-colors">About T.I.P.</a></li>
                <li><a href="https://tip.edu.ph/be-a-tip-ian/tip-enrollment-guidelines/" className="hover:text-white transition-colors">FAQs</a></li>
                <li><a href="https://admission.tip.edu.ph/web/" className="hover:text-white transition-colors">Admission</a></li>
                <li><a href="https://tip.edu.ph/career-at-tip/" className="hover:text-white transition-colors">Careers at T.I.P.</a></li>
              </ul>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <div className="space-y-3">
                <a href="https://www.facebook.com/TIP1962official" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors">
                  <img src="/assets/FB.png" alt="Facebook Logo" className="w-6 h-6"/>
                  <span>Facebook</span>
                </a>
                <a href="https://x.com/TIP1962official" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors">
                  <img src="/assets/X.png" alt="X Logo" className="w-6 h-6"/>
                  <span>X (Twitter)</span>
                </a>
                <a href="https://www.instagram.com/tip1962official/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors">
                  <img src="/assets/IG.png" alt="Instagram Logo" className="w-6 h-6"/>
                  <span>Instagram</span>
                </a>
                <a href="https://www.youtube.com/@TIPTVOFFICIAL" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors">
                  <img src="/assets/YT.png" alt="YouTube Logo" className="w-6 h-6"/>
                  <span>YouTube</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Section and Privacy Policy */}
        <div className="text-center text-xs text-gray-400 mt-12 border-t border-gray-700 pt-8">
          <a
            href="https://tip.edu.ph/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white hover:underline transition-colors"
          >
            Privacy Policy
          </a>
          <span className="mx-2">|</span>
          <span>© {new Date().getFullYear()} Technological Institute of the Philippines. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}