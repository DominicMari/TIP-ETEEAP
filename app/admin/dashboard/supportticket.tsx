"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupportTicket() {

  const [tickets, setTickets] = useState<any[]>([]);
  const [resolvedTickets, setResolvedTickets] = useState<string[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");

  // FETCH TICKETS FROM DATABASE
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {

    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
    } else {
      setTickets(data || []);
    }
  };

  const toggleResolve = (id: string) => {
    if (resolvedTickets.includes(id)) {
      setResolvedTickets(resolvedTickets.filter((ticket) => ticket !== id));
    } else {
      setResolvedTickets([...resolvedTickets, id]);
    }
  };

  const getStatus = (id: string) =>
    resolvedTickets.includes(id) ? "Resolved" : "Pending";

  const filteredTickets = tickets.filter((ticket) => {

    const status = getStatus(ticket.id);

    const matchesStatus =
      filterStatus === "All" || filterStatus === status;

    const matchesSearch =
      ticket.subject?.toLowerCase().includes(search.toLowerCase()) ||
      ticket.user_name?.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="text-black font-bold mb-4">

      <h1 className="text-xl font-bold mb-6">Support Tickets</h1>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 text-amber-900 rounded-lg text-sm w-full sm:w-64"
        >
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Resolved">Resolved</option>
        </select>

        <input
          type="text"
          placeholder="Search ticket..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 text-amber-900 rounded-lg text-sm w-full sm:w-64"
        />

      </div>

      {/* TABLE */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">

        <div className="overflow-x-auto">

          <table className="min-w-full text-sm">

            <thead className="bg-yellow-100 text-amber-900">
              <tr className="text-left">
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">

              {filteredTickets.map((ticket) => {

                const isLong = ticket.message?.length > 60;
                const status = getStatus(ticket.id);

                return (
                  <tr key={ticket.id} className="hover:bg-yellow-50 text-yellow-700">

                    <td className="px-4 py-3 font-mono text-xs">
                      {ticket.id.slice(0,6)}
                    </td>

                    <td className="px-4 py-3">
                      {ticket.user_name}
                    </td>

                    <td className="px-4 py-3">
                      {ticket.subject}
                    </td>

                    <td className="px-4 py-3 max-w-xs">

                      <div className="flex items-center justify-between gap-2">

                        <span className="truncate block text-sm">
                          {ticket.message}
                        </span>

                        {isLong && (
                          <button
                            onClick={() => setSelectedMessage(ticket.message)}
                            className="text-xs text-white bg-yellow-500 hover:bg-yellow-600 px-2 py-1 rounded"
                          >
                            View
                          </button>
                        )}

                      </div>

                    </td>

                    <td className="px-4 py-3">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 text-center">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          status === "Resolved"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {status}
                      </span>

                    </td>

                    <td className="px-4 py-3 text-center">

                      <button
                        onClick={() => toggleResolve(ticket.id)}
                        className={`px-4 py-1 rounded-lg text-white text-xs font-semibold ${
                          status === "Resolved"
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }`}
                      >
                        {status === "Resolved" ? "Resolved" : "Resolve"}
                      </button>

                    </td>

                  </tr>
                );
              })}

              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500">
                    No tickets found
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* MESSAGE MODAL */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-lg p-6">

            <h2 className="text-lg font-semibold text-amber-900 mb-4">
              Ticket Message
            </h2>

            <p className="text-sm text-gray-700 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
              {selectedMessage}
            </p>

            <div className="flex justify-end mt-6">

              <button
                onClick={() => setSelectedMessage(null)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}