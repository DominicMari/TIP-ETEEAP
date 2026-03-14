"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';

export default function SupportTicket() {

    //resolve
    const [resolvedTickets, setResolvedTickets] = useState<number[]>([]);

  const toggleResolve = (id: number) => {
    if (resolvedTickets.includes(id)) {
      setResolvedTickets(resolvedTickets.filter((ticket) => ticket !== id));
    } else {
      setResolvedTickets([...resolvedTickets, id]);
    }
  };
//notifs
  const [showNotif, setShowNotif] = useState(false);

  const handleSampleNotif = () => {
    setShowNotif(true);
    setTimeout(() => setShowNotif(false), 3000);
  };

    return (
        <div className="text-black font-bold mb-4"> 
           {/* Notification */}
      {showNotif && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn">
          You received a new ticket!
        </div>
      )}
        <h1>List of Tickets</h1>

<div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4 mt-7 ">
         {/* Filter sample */}
         <select className="px-3 py-2 border border-gray-300 text-amber-900 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-yellow-500 ">
            <option>Pending</option>
            <option>Closed</option>
         </select>
        <input
            type="text"
            placeholder="Search ticket..."
            className="px-3 py-2 border border-gray-300 text-amber-900 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />

         
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 items-center justify-between">
        {/* table */}
        <div className="overflow-x-auto rounded-lg border border-gray-002">
            <table className="min-w-full full">
                <thead className="bg-yellow-100">
                    <tr className="text-left text-sm text-amber-900 ">
                        <th className="px-4 py-3">Ticket ID</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Date Submitted</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Subject</th>
                    </tr>
                </thead>

<tbody>
    {/*Sample users */}

    <tr className="divide-y divide-gray-200 text-sm text-yellow-700 ">
        <td className="px-4 py-3">#1</td>
        <td className="px-4 py-3">JustinUY</td>
        <td className="px-4 py-3">3/11/2026</td>
        <td className="px-4 py-3">Application Issue</td>

        <td className="px-4 py-3 flex justify-between items-center ">
                <span>The responsive is not okay</span>
                  <button
                  onClick={() => toggleResolve(1)}
                  className={`font-semibold py-2 px-4 rounded-lg text-white ${
                    resolvedTickets.includes(1)
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  }`}
                >
                  {resolvedTickets.includes(1) ? "Resolved" : "Resolve"}
                </button>
        </td>
    </tr>

       <tr className="divide-y divide-gray-200 text-sm text-yellow-700">
        <td className="px-4 py-3">#2</td>
        <td className="px-4 py-3">El Gato</td>
        <td className="px-4 py-3">3/11/2026</td>
        <td className="px-4 py-3">Account concern</td>
        <td className="px-4 py-3 flex justify-between items-center">
                <span>I can't log out</span>
                <button
                  onClick={() => toggleResolve(2)}
                  className={`font-semibold py-2 px-4 rounded-lg text-white ${
                    resolvedTickets.includes(2)
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  }`}
                >
                  {resolvedTickets.includes(2) ? "Resolved" : "Resolve"}
                </button>
        </td>
    </tr>
     <tr className="divide-y divide-gray-200 text-sm text-yellow-700">
        <td className="px-4 py-3">#3</td>
        <td className="px-4 py-3">Namename</td>
        <td className="px-4 py-3">3/11/2026</td>
        <td className="px-4 py-3">Application Issue</td>

        <td className="px-4 py-3 flex justify-between items-center">
                <span>App won't work</span>
                  <button
                  onClick={() => toggleResolve(3)}
                  className={`font-semibold py-2 px-4 rounded-lg text-white ${
                    resolvedTickets.includes(3)
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  }`}
                >
                  {resolvedTickets.includes(3) ? "Resolved" : "Resolve"}
                </button>
        </td>
    </tr>

       <tr className="divide-y divide-gray-200 text-sm text-yellow-700">
        <td className="px-4 py-3">#4</td>
        <td className="px-4 py-3">Name Lastname</td>
        <td className="px-4 py-3">3/11/2026</td>
        <td className="px-4 py-3">Account concern</td>
        <td className="px-4 py-3 flex justify-between items-center">
                <span>I can't log in</span>
                <button
                  onClick={() => toggleResolve(4)}
                  className={`font-semibold py-2 px-4 rounded-lg text-white ${
                    resolvedTickets.includes(4)
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  }`}
                >
                  {resolvedTickets.includes(4) ? "Resolved" : "Resolve"}
                </button>
        </td>
    </tr>
     <tr className="divide-y divide-gray-200 text-sm text-yellow-700">
        <td className="px-4 py-3">#1</td>
        <td className="px-4 py-3">JustinSecond</td>
        <td className="px-4 py-3">3/11/2026</td>
        <td className="px-4 py-3">Application Issue</td>

        <td className="px-4 py-3 flex justify-between items-center">
                <span>I can't open the forms</span>
                  <button
                  onClick={() => toggleResolve(5)}
                  className={`font-semibold py-2 px-4 rounded-lg text-white ${
                    resolvedTickets.includes(5)
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  }`}
                >
                  {resolvedTickets.includes(5) ? "Resolved" : "Resolve"}
                </button>
        </td>
    </tr>

       <tr className="divide-y divide-gray-200 text-sm text-yellow-700">
        <td className="px-4 py-3">#2</td>
        <td className="px-4 py-3">Sample Justin</td>
        <td className="px-4 py-3">3/11/2026</td>
        <td className="px-4 py-3">Account concern</td>
        <td className="px-4 py-3 flex justify-between items-center">
                <span>I forgot my password and can't log in on my other account</span>
                <button
                  onClick={() => toggleResolve(6)}
                  className={`font-semibold py-2 px-4 rounded-lg text-white ${
                    resolvedTickets.includes(6)
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  }`}
                >
                  {resolvedTickets.includes(6) ? "Resolved" : "Resolve"}
                </button>
        </td>
    </tr>
</tbody>



            </table>
         </div>


            
        </div>

    {/*Sample Notif*/} 
    <button onClick={handleSampleNotif} className="bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-yellow-600 mt-7">Sample Notif</button>
        

        </div>

    )

    

}