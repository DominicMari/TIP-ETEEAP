"use client";
import React, { useState, useEffect, MouseEvent, useRef } from "react";
import { useSession } from "next-auth/react";

// Type Definitions
type Program = {
  title: string;
  outcomes: string[];
  description: string;
  imageUrl: string;
};

// Programs Data 
const engineeringPrograms: Program[] = [
  {
    title: "Bachelor of Science in Computer Science",
    description:
      "This program focuses on the core theories, algorithms, and applications of computing. Graduates are prepared for careers in software development, data science, and advanced research, with a strong emphasis on problem analysis and solution design.",
    imageUrl: "/assets/mainsection_banners/Computer_Science.png",
    outcomes: [
      "Analyze complex computing problems and to apply principles of computing and other relevant disciplines to identify solutions.",
      "Design, implement, and evaluate a computing-based solution to meet a given set of computing requirements in the context of the program’s discipline.",
      "Communicate effectively in a variety of professional contexts.",
      "Recognize professional responsibilities and make informed judgments in computing practice based on legal and ethical principles.",
      "Function effectively as a member or leader of a team engaged in activities appropriate to the program’s discipline.",
      "For Computer Science: Apply Computer Science theory and software development fundamentals to produce computing-based solutions.",
    ],
  },
  {
    title: "Bachelor of Science in Information Systems",
    description:
      "The Information Systems program bridges business and technology, focusing on the design and management of IT solutions that support organizational processes and strategic goals. Ideal for future business analysts and IT managers.",
    imageUrl: "/assets/mainsection_banners/Information_Systems.png",
    outcomes: [
      "Analyze a problem, and identify and define the computing requirements appropriate to its solution.",
      "Design, implement, and evaluate a computer-based system, process, component, or program to meet desired needs and specifications.",
      "Communicate effectively with a range of audiences.",
      "Recognize the legal, ethical, and societal implications of the profession.",
      "Function effectively on teams to accomplish a common goal.",
      "For Information Systems: Support the delivery, use, and management of information systems within an information systems environment ",
    ],
  },
  {
    title: "Bachelor of Science in Information Technology",
    description:
      "A hands-on program centered on the application of technology to support business and user needs. Graduates specialize in areas like network administration, security, and web development, becoming practical problem-solvers in the IT field.",
    imageUrl: "/assets/mainsection_banners/Information_Technology.png",
    outcomes: [
      "Analyze a complex problem and apply computing principles to identify solutions.",
      "Design, implement, and evaluate an IT-based solution to meet a given set of user needs and specifications.",
      "Communicate effectively with diverse audiences.",
      "Recognize professional and ethical responsibilities in the IT field.",
      "Function effectively as a member or leader of a team.",
      "For Information Technology: Apply IT principles and practices to support the design, development, implementation, and management of IT-based solutions.",
    ],
  },
  {
    title: "Bachelor of Science in Computer Engineering",
    description:
      "This discipline combines electrical engineering and computer science to focus on the design and development of computer hardware and software. It prepares professionals to work with embedded systems, VLSI design, and computer architecture.",
    imageUrl: "/assets/mainsection_banners/Computer_Engineering.png",
    outcomes: [
      "To identify, formulate, and solve complex engineering problems by applying knowledge and principles of engineering, science, mathematics, and an engineering specialization.",
      "Apply engineering design to produce solutions that meet specified needs with consideration of public health, safety, welfare, global, cultural, social, environmental, and economic factors.",
      "communicate effectively and inclusively on complex engineering activities with a range of audiences, such as being able to comprehend, write, and present in a variety of ways effectively considering cultural, language, and learning differences.",
      "Applyprinciples of ethics and commit to professional ethics, technology ethics, data ethics, global responsibilities, and norms of engineering practice; and adhere to relevant national and international laws. Comprehend the need for diversity and inclusion. Recognize ethical and professional responsibilities in engineering situations and make informed judgments, which must consider the sustainability impact of engineering solutions in human, cultural, global, economic, environmental, and societal contexts.",
      "Function effectively as an individual member in diverse and inclusive teams and/or leader who provides leadership, creates a collaborative and inclusive environment, establishes goals, plans tasks, and meets objectives in multi-disciplinary and long-distance settings by applying knowledge of engineering and management principles, and also understands the impact of engineering solutions in societal and environmental contexts.",
      "develop and conduct appropriate experimentation, analyze and interpret data, and use engineering judgment to draw conclusions.",
      "acquire and apply new knowledge as needed, using appropriate learning strategies to engage in independent and life-long learning, creativity and adaptability to new and emerging technologies, and critical thinking in the broadest context of technological change.",
    ],
  },
  {
    title: "Bachelor of Science in Industrial Engineering",
    description:
      "Industrial Engineering focuses on optimizing complex processes, systems, or organizations by developing, improving, and implementing integrated systems of people, materials, information, equipment, and energy.",
    imageUrl: "/assets/mainsection_banners/Industrial_Engineering.png",
    outcomes: [
      "Apply knowledge of mathematics, physical sciences, and engineering sciences to the practice of industrial engineering.",
      "Design and conduct experiments, as well as to analyze and interpret data.",
      "Design, improve, and install integrated systems of people, materials, information, equipment, and energy.",
      "Function effectively as a member or a leader in diverse teams.",
      "Understand the ethical, social, and professional responsibilities.",
    ],
  },
];
const businessAdminSpecializationData: Program[] = [
  {
    title: "BS Business Administration Major in Logistics and Supply Chain Management",
    description: "Focuses on optimizing the flow of goods and services, from origin to consumption. Graduates manage global supply chains, inventory, procurement, and logistics operations.",
    imageUrl: "/assets/mainsection_banners/Logistics_and_Supply_Chain_Management.png",
    outcomes: [
      "Manage end-to-end supply chain processes efficiently.",
      "Analyze and optimize inventory systems and warehousing operations.",
      "Apply quantitative methods for decision-making in logistics.",
      "Formulate international trade and customs compliance strategies.",
    ],
  },
  {
    title: "BS Business Administration Major in Financial Management",
    description: "Prepares students to manage the financial health of organizations. Focuses on investment, financial planning, risk management, and capital budgeting.",
    imageUrl: "/assets/mainsection_banners/Financial_Management.png",
    outcomes: [
      "Analyze financial statements and conduct corporate valuation.",
      "Manage investment portfolios and assess financial risks.",
      "Develop and implement strategic financial plans.",
      "Understand capital markets and financial institutions.",
    ],
  },
  {
    title: "BS Business Administration Major in Human Resources Management",
    description: "Focuses on maximizing employee productivity and protecting the organization from issues by managing employee relations, compensation, recruitment, and training.",
    // FIX: Removed double slash from image URL
    imageUrl: "/assets/mainsection_banners/Human_Resources_Management.png",
    outcomes: [
      "Design effective recruitment and selection strategies.",
      "Develop performance management and compensation systems.",
      "Navigate labor relations and legal compliance issues.",
      "Implement organizational development and training programs.",
    ],
  },
  {
    title: "BS Business Administration Major in Marketing Management",
    description: "Teaches the creation, communication, delivery, and exchange of offerings that have value for customers, clients, partners, and society at large.",
    imageUrl: "/assets/mainsection_banners/Marketing_Management.png",
    outcomes: [
      "Conduct comprehensive market research and analysis.",
      "Develop and execute integrated marketing communication plans.",
      "Formulate branding and product development strategies.",
      "Utilize digital platforms for modern marketing campaigns.",
    ],
  },
];
const businessAdminContainer: Program = {
  title: "Bachelor of Science in Business Administration",
  description:
    "Select a specialization to view the specific curriculum, outcomes, and program description.",
  // FIX: Changed imageUrl from a directory to a specific placeholder
  imageUrl: "/assets/mainsection_banners/Business_Admin.png",
  outcomes: [],
};

// --- Program Modal Component ---
function ProgramModal({
  program,
  onClose,
}: {
  program: Program | null;
  onClose: () => void;
}) {
  const isModalOpen = !!program;
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      setIsImageLoaded(false);
    }
  }, [isModalOpen]);

  const overlayClass = `fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-500 p-4 ${isModalOpen ? "bg-opacity-80 backdrop-blur-md" : "bg-opacity-0 pointer-events-none"}`;
  
  // FIX: Removed 'group/modal' class to disable hover effect
  const modalContentClass = `bg-white text-gray-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-4xl w-full h-[95vh] overflow-hidden flex flex-col transform transition-all duration-500 ease-out ${isModalOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-8"}`;

  if (!isModalOpen || !program) return null;

  const allOutcomes = [...program.outcomes];

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={modalContentClass} onClick={(e) => e.stopPropagation()}>
        <header className="flex-shrink-0 relative">
          <div className={`relative h-56 overflow-hidden ${!isImageLoaded ? 'bg-gray-200 animate-pulse' : ''}`}>
            {/* FIX: Removed 'group-hover/modal:scale-105' to disable hover effect */}
            <img 
              src={program.imageUrl} 
              alt={`${program.title} banner`} 
              className={`w-full h-full object-cover transition-all duration-700 ease-out ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`} 
              onLoad={() => setIsImageLoaded(true)} 
              onError={(e) => { const img = e.target as HTMLImageElement; img.onerror = null; img.src = '/assets/default-avatar.png'; setIsImageLoaded(true); }} 
            />
            
            <button onClick={onClose} className="absolute top-4 right-4 z-10 text-gray-900 hover:text-white transition-colors p-3 rounded-full bg-yellow-400 hover:bg-red-600 shadow-lg transform hover:scale-105" aria-label="Close modal" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-6 border-b border-gray-200 bg-white/95 backdrop-blur-md">
            <h3 className="text-4xl font-extrabold leading-tight text-gray-900">{program.title}</h3>
          </div>
        </header>
        
        <div className="flex-grow overflow-y-auto custom-scrollbar">
            <div className="p-8">
              <section className="mb-12">
                <h4 className="text-2xl font-bold mb-4 text-gray-800">Overview</h4>
                <p className="text-gray-700 leading-relaxed text-lg font-light">{program.description}</p>
              </section>

              <section className="mb-12">
                <h4 className="text-2xl font-bold mb-6 text-gray-800">Student Outcomes</h4>
                <div className="space-y-4">
                  {allOutcomes.map((outcome, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-100 rounded-lg">
                      <span className="flex-shrink-0 bg-yellow-400 text-gray-900 font-bold w-7 h-7 rounded-full flex items-center justify-center text-sm">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 flex-1">{outcome}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
        </div>
      </div>
    </div>
  );
}

// FIX: Second definition of ProgramModal was removed. This is the single, correct version now.


function ProgramCard({
  program,
  onClick,
  clickEffect,
}: {
  program: Program;
  onClick: (program: Program) => void;
  clickEffect: string | null;
}) {
  return (
    <button
      onClick={() => onClick(program)}
      type="button"
      className={`group flex items-center gap-4 p-4 w-full text-left rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-800/50 ${program.title === clickEffect ? 'bg-white/50 scale-[0.98]' : 'bg-white/20 backdrop-blur-sm hover:bg-white/30 hover:translate-x-2'}`}
    >
      <div className="w-2 h-2 bg-gray-800 rounded-full flex-shrink-0 group-hover:scale-150 transition-transform duration-300"></div>
      <p className="text-lg font-medium text-gray-800 leading-relaxed group-hover:font-semibold transition-all duration-300">{program.title}</p>
    </button>
  );
}



export default function MainSection({
  setShowLogin,
}: {
  setShowLogin: (value: boolean) => void;
}) {
  const { data: session } = useSession();
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showSpecializations, setShowSpecializations] = useState(false);
  const [clickEffect, setClickEffect] = useState<string | null>(null);

  const handleProgramClick = (program: Program) => {
    setClickEffect(program.title);
    setTimeout(() => {
        setSelectedProgram(program);
        setClickEffect(null);
    }, 150);
  };

  const handleCloseModal = () => setSelectedProgram(null);

  useEffect(() => {
    document.body.style.overflow = selectedProgram ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedProgram]);

  return (
    <>
      <div className="flex flex-col lg:flex-row items-stretch min-h-screen mt-12">
        {/* Left Section */}
        <div className="relative flex flex-col justify-center items-center lg:w-1/2 p-8 lg:p-12 bg-gradient-to-br from-gray-800 via-gray-900 to-black">
          <div className="relative z-10 text-center max-w-lg">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-xl"><img src="/assets/TIPLogo.png" className="w-12 h-12 object-contain" onError={(e) => { const img = e.target as HTMLImageElement; img.onerror = null; img.style.display = "none"; }}/></div>
              <div className="text-left"><p className="text-yellow-400 text-lg font-bold tracking-wider">Technological</p><p className="text-xs text-gray-400 uppercase tracking-widest">Institute of the Philippines</p></div>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 drop-shadow-2xl mb-4 tracking-tight leading-none">ETEEAP</h1>
            <div className="mb-8"><p className="text-xl lg:text-2xl font-light text-gray-300 mb-2 leading-relaxed">Expanded Tertiary Education</p><p className="text-xl lg:text-2xl font-light text-gray-300 mb-4 leading-relaxed">Equivalency & Accreditation Program</p><div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto rounded-full"></div></div>
            <p className="text-base text-gray-400 mb-10 leading-relaxed max-w-sm mx-auto">Transform your professional experience into academic credentials through our comprehensive accreditation program.</p>
            {!session && (<button onClick={() => setShowLogin(true)} type="button" className="group relative overflow-hidden bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-4 px-8 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"><span className="relative z-10 flex items-center gap-3 text-lg">Get Started<span className="group-hover:translate-x-1 transition-transform duration-300">→</span></span><div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div></button>)}
          </div>
        </div>

        {/* --- Right Section --- */}
        <div className="lg:w-1/2 p-8 lg:p-12 bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 text-gray-900 relative overflow-hidden">
          <div className="relative z-10">
            <div className="mb-10"><h2 className="text-4xl lg:text-5xl font-black mb-4 text-gray-900 leading-tight">Programs<span className="block text-3xl lg:text-4xl font-light text-gray-700">Offered</span></h2><div className="w-16 h-1 bg-gray-800 rounded-full"></div></div>
            <div className="space-y-3">
              {engineeringPrograms.map((program) => (<ProgramCard key={program.title} program={program} onClick={handleProgramClick} clickEffect={clickEffect} />))}
              <div onClick={() => setShowSpecializations(!showSpecializations)} className={`group cursor-pointer rounded-xl transition-all duration-300 ${showSpecializations ? 'bg-white/40' : 'bg-white/20 backdrop-blur-sm hover:bg-white/30 hover:translate-x-2'}`}>
                <button type="button" className="flex items-center gap-4 p-4 w-full text-left focus:outline-none focus:ring-4 focus:ring-gray-800/50"><div className={`w-2 h-2 bg-gray-800 rounded-full flex-shrink-0 transition-transform duration-300 ${showSpecializations ? 'scale-150' : 'group-hover:scale-150'}`}></div><p className="text-lg font-black text-gray-800 leading-relaxed transition-all duration-300">{businessAdminContainer.title}</p><svg className={`ml-auto w-5 h-5 transition-transform duration-300 ${showSpecializations ? 'rotate-90' : 'rotate-0'}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></button>
              </div>
              {showSpecializations && (
                <div className="ml-6 space-y-2 pb-4 transition-all duration-500 ease-in-out">
                  {businessAdminSpecializationData.map((spec) => (<button key={spec.title} onClick={(e) => { e.stopPropagation(); handleProgramClick(spec); }} type="button" className={`flex items-center gap-3 p-3 w-full text-left rounded-lg border border-transparent hover:border-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-700/50 ${spec.title === clickEffect ? 'bg-white/70 scale-[0.99] shadow-md' : 'bg-white/40 hover:bg-white/50'}`}><div className={`w-1.5 h-1.5 bg-gray-700 rounded-full flex-shrink-0`}></div><p className="text-base font-medium text-gray-800 leading-relaxed">{spec.title.split(' Major in ')[1]}</p></button>))}
                </div>
              )}
            </div>
            <div className="mt-10 p-6 bg-white/20 backdrop-blur-sm rounded-xl"><p className="text-sm text-gray-700 font-medium text-center">📚 All programs are designed for working professionals with relevant experience</p></div>
          </div>
        </div>
      </div>
      <ProgramModal program={selectedProgram} onClose={handleCloseModal} />
    </>
  );
}