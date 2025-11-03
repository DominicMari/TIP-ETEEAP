"use client";

import { useEffect, useState, useMemo, FC, ReactNode } from "react";
import supabase from "../../../lib/supabase/client"; // Use shared client
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  Loader2, Users, CheckCircle, Clock, XCircle, LogIn, ShieldUser,
  GraduationCap, Calendar, BarChart3, AlertCircle,
} from "lucide-react";

// --- Type Definitions ---
interface Applicant {
  application_id: string;
  created_at: string;
  degree_applied_for: string | null;
  campus: string | null;
  status: string | null;
  user_id?: string;
}

// --- Constants ---
const STATUS_COLORS: Record<string, string> = {
  Approved: "#10B981",
  Pending: "#F59E0B",
  Declined: "#EF4444",
  Submitted: "#6B7280",
};
const programMap: Record<string, string> = {
  "BSCS": "CS",
  "BSIS": "IS",
  "BSIT": "IT",
  "BSCpE": "CpE",
  "BSIE": "IE",
  "BSBA-LSCM": "BA-LSCM",
  "BSBA-FM": "BA-FM",
  "BSBA-HRM": "BA-HRM",
  "BSBA-MM": "BA-MM",
  "Bachelor of Science in Computer Science": "CS",
  "Bachelor of Science in Information Systems": "IS",
  "Bachelor of Science in Information Technology": "IT",
  "Bachelor of Science in Computer Engineering": "CpE",
  "Bachelor of Science in Industrial Engineering": "IE",
  "BS Business Administration Major in Logistics and Supply Chain Management": "BA-LSCM",
  "BS Business Administration Major in Financial Management": "BA-FM",
  "BS Business Administration Major in Human Resources Management": "BA-HRM",
  "BS Business Administration Major in Marketing Management": "BA-MM",
};

// --- Reusable Components ---
const ChartContainer: FC<{ title: string; icon: ReactNode; children: ReactNode; className?: string }> = ({
  title, icon, children, className = ""
}) => (
  <div className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${className}`}>
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-3">
        <div className="text-gray-500">{icon}</div>
        <h3 className="font-semibold text-md text-gray-800">{title}</h3>
      </div>
    </div>
    <div className="h-80">{children}</div>
  </div>
);

// (Il tuo fix per StatCard è corretto e rimane invariato)
const StatCard: FC<{ title: string; value: string | number; icon: ReactNode }> = ({
  title, value, icon,
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-200 min-h-[88px]">
    <div className="flex-shrink-0">
      <div className="bg-yellow-100 text-yellow-600 p-3 rounded-full">{icon}</div>
    </div>
    <div className="flex-1 flex flex-col">
      <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

// --- Main Dashboard Component ---
export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allApplicants, setAllApplicants] = useState<Applicant[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [chartCampus, setChartCampus] = useState<"Manila" | "Quezon City">("Manila");

  // Fetch all necessary data on mount
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("[DashboardHome] Fetching data...");
        const [
          applicationsRes,
          userLoginHistoryRes,
          adminLoginHistoryRes
        ] = await Promise.all([
          supabase
            .from("applications")
            .select("application_id, created_at, status, degree_applied_for, campus"),
          supabase
            .from("user_login_history")
            .select("email, user_id"),
          supabase
            .from("admin_login_history")
            .select("email, admin_id"),
        ]);

        if (applicationsRes.error) throw new Error(`Applications fetch failed: ${applicationsRes.error.message}`);
        const applications = applicationsRes.data || [];

        if (userLoginHistoryRes.error) throw new Error(`User login history fetch failed: ${userLoginHistoryRes.error.message}`);
        const userLoginsData = userLoginHistoryRes.data || [];

        if (adminLoginHistoryRes.error) throw new Error(`Admin login history fetch failed: ${adminLoginHistoryRes.error.message}`);
        const adminLoginsData = adminLoginHistoryRes.data || [];

        if (isMounted) {
          setAllApplicants(applications as Applicant[]);
          const uniqueUserEmails = new Set(userLoginsData.map(log => log.email).filter(Boolean));
          setTotalUsers(uniqueUserEmails.size);
          const uniqueAdminEmails = new Set(adminLoginsData.map(log => log.email).filter(Boolean));
          setTotalAdmins(uniqueAdminEmails.size);
        }

      } catch (err) {
        console.error("[DashboardHome] Error fetching dashboard data:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "An unknown error occurred");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log("[DashboardHome] Data fetch finished.");
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []); // Run once on mount

  // --- Calculations ---

  const applicationStats = useMemo(() => {
    return {
      total: allApplicants.length,
      approved: allApplicants.filter((a) => a.status === "Approved").length,
      pending: allApplicants.filter((a) => a.status === "Pending" || a.status === "Submitted").length,
      declined: allApplicants.filter((a) => a.status === "Declined").length,
    };
  }, [allApplicants]);

  const chartApplicants = useMemo(() => {
    const normalizedChartCampus = chartCampus.toLowerCase(); // "manila" or "quezon city"
    
    const filtered = allApplicants.filter((app) => {
      const normalizedAppCampus = app.campus?.trim().toLowerCase(); // "qc" or "manila"
      
      if (normalizedChartCampus === 'quezon city') {
        // If user clicked "Quezon City" button, look for "qc" in the data
        return normalizedAppCampus === 'qc';
      }
      return normalizedAppCampus === normalizedChartCampus;
    });

    console.log(`[DashboardHome] Filtering for "${chartCampus}": Found ${filtered.length} of ${allApplicants.length} total.`);
    return filtered;
  }, [allApplicants, chartCampus]);


  // Data for "Top Programs" chart
  const programData = useMemo(() => {
    const byDegree = chartApplicants.reduce((acc, app) => {
      const degreeKey = app.degree_applied_for || "N/A";
      const shortName = programMap[degreeKey] || degreeKey;
      acc[shortName] = (acc[shortName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byDegree)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [chartApplicants]);

  // Data for "Applicant Status" chart
  const statusData = useMemo(() => {
    const counts = chartApplicants.reduce((acc, a) => {
        const status = a.status || 'Submitted';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statuses = ["Approved", "Pending", "Declined", "Submitted"];
    return statuses.map(name => ({
        name: name,
        value: counts[name] || 0
    })).filter(entry => entry.value > 0);
  }, [chartApplicants]);

  // Data for "Application Volume" chart (time series)
  const timeSeriesData = useMemo(() => {
    const byDate = chartApplicants.reduce((acc, app) => {
      try {
          const dateStr = new Date(app.created_at).toISOString().split("T")[0];
          if (dateStr) {
              acc[dateStr] = (acc[dateStr] || 0) + 1;
          }
      } catch (e) {
         console.warn("Invalid date format in application:", app.created_at, e);
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [chartApplicants]);


  // --- Render Logic ---

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)] text-gray-600">
        <Loader2 className="animate-spin mr-3 h-8 w-8" />
        <span className="text-lg font-medium">Loading Dashboard Data...</span>
      </div>
    );
  }

  if (error) {
     return (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
          <div className="flex items-center">
              <AlertCircle className="h-6 w-6 mr-3" />
              <div>
                <p className="font-bold">Error Loading Dashboard</p>
                <p>{error}</p>
              </div>
          </div>
        </div>
      );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards Row */}
      {/* 🔽🔽🔽 --- CSS FIX IS HERE --- 🔽🔽🔽 */}
      {/* Changed grid to have max 3 cols on large screens, making cards wider */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 🔼🔼🔼 --- END OF CSS FIX --- 🔼🔼🔼 */}
        <StatCard title="Total Applications" value={applicationStats.total} icon={<Users size={20} />} />
        <StatCard title="Approved" value={applicationStats.approved} icon={<CheckCircle size={20} />} />
        <StatCard title="Pending / Submitted" value={applicationStats.pending} icon={<Clock size={20} />} />
        <StatCard title="Declined" value={applicationStats.declined} icon={<XCircle size={20} />} />
        <StatCard title="Total Unique Users" value={totalUsers} icon={<LogIn size={20} />} />
        <StatCard title="Total Unique Admins" value={totalAdmins} icon={<ShieldUser size={20} />} />
      </div>

      {/* Campus Switch */}
      <div className="flex justify-center md:justify-start">
        <div className="inline-flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm">
          <button
            onClick={() => setChartCampus("Manila")}
            className={`px-5 py-1.5 text-sm font-semibold rounded-full transition-colors ${
              chartCampus === "Manila" ? "bg-yellow-400 text-black shadow" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Manila Campus
          </button>
          <button
            onClick={() => setChartCampus("Quezon City")}
            className={`px-5 py-1.5 text-sm font-semibold rounded-full transition-colors ${
              chartCampus === "Quezon City" ? "bg-yellow-400 text-black shadow" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Quezon City Campus
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Application Volume Chart */}
        <ChartContainer
          title={`Application Volume - ${chartCampus}`}
          icon={<Calendar size={18} />}
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeriesData} margin={{ top: 5, right: 20, left: -5, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#FBBF24" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false}/>
              <XAxis dataKey="date" fontSize={11} tick={{ fill: "#6B7280" }} stroke="#D1D5DB" axisLine={false} tickLine={false} />
              <YAxis fontSize={11} tick={{ fill: "#6B7280" }} stroke="#D1D5DB" axisLine={false} tickLine={false} allowDecimals={false}/>
              <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: '0.5rem' }} />
              <Area type="monotone" dataKey="count" stroke="#F59E0B" fillOpacity={1} fill="url(#colorCount)" name="Applications" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Status Pie Chart */}
        <ChartContainer
          title={`Applicant Status - ${chartCampus}`}
          icon={<BarChart3 size={18} />}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={3}
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                fontSize={11}
              >
                {statusData.map((entry) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={STATUS_COLORS[entry.name] || STATUS_COLORS['Submitted']}
                    className="outline-none focus:outline-none"
                    stroke="none"
                  />
                ))}
              </Pie>
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
               <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

         {/* Top Programs Bar Chart */}
        <ChartContainer
          title={`Top Programs - ${chartCampus}`}
          icon={<GraduationCap size={18} />}
          className="lg:col-span-3"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={programData}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#6B7280" }} fontSize={11} stroke="#D1D5DB" axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={60}
                tick={{ fill: "#6B7280" }}
                fontSize={11}
                stroke="#D1D5DB"
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={{ backgroundColor: "white", border: "1x solid #E5E7EB", borderRadius: '0.5rem' }}/>
              <Bar dataKey="count" name="Applicants" fill="#3B82F6" barSize={20} radius={[0, 4, 4, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

      </div>
    </div>
  );
}