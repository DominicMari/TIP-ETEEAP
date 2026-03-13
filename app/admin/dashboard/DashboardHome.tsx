"use client";

import { useEffect, useState, useMemo, FC, ReactNode } from "react";
import supabase from "../../../lib/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
} from "recharts";
import {
  Loader2, Users, CheckCircle, Clock, XCircle, LogIn, ShieldUser,
  GraduationCap, Calendar, BarChart3, AlertCircle, Search, X,
} from "lucide-react";

// ─── Type Definitions ────────────────────────────────────────────────
interface PortfolioSubmission {
  id: number;
  created_at: string;
  status: string;
  degree_program: string;
  full_name?: string | null;
  campus?: string | null;
}

interface Applicant {
  application_id: string;
  created_at: string;
  degree_applied_for: string | null;
  campus: string | null;
  status: string | null;
  applicant_name?: string | null;
  user_id?: string;
}

type CampusMetric = "total" | "approved" | "pending" | "declined";

type SearchResultItem = {
  id: string;
  formType: "Application" | "Portfolio";
  name: string;
  status: string;
  program: string;
  campus: string;
  createdAt: string;
  score: number;
};

type SearchViewMode = "selected" | "all";
type SearchStatusFilter = "All" | "Submitted" | "Pending" | "Approved" | "Declined";

// ─── Constants ───────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  Approved: "#10B981", Pending: "#F59E0B", Declined: "#EF4444", Submitted: "#6B7280",
};
const CAMPUS_METRIC_COLORS: Record<CampusMetric, string> = {
  total: "#F4C300", approved: "#1D4ED8", pending: "#F59E0B", declined: "#EF4444",
};
const CAMPUS_METRIC_LABELS: Record<CampusMetric, string> = {
  total: "Total", approved: "Approved", pending: "Pending", declined: "Declined",
};
const programMap: Record<string, string> = {
  "BSCS": "CS", "BSIS": "IS", "BSIT": "IT", "BSCpE": "CpE", "BSIE": "IE",
  "BSBA-LSCM": "BA-LSCM", "BSBA-FM": "BA-FM", "BSBA-HRM": "BA-HRM", "BSBA-MM": "BA-MM",
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
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PROGRAM_COLORS = ["#1D4ED8","#10B981","#EF4444","#F4C300","#8B5CF6","#F59E0B","#06B6D4","#EC4899","#6B7280"];

// ─── Helpers ─────────────────────────────────────────────────────────
const normalizeCampus = (campus: string | null | undefined): "Manila" | "Quezon City" | null => {
  const value = campus?.trim().toLowerCase();
  if (!value) return null;
  if (["qc", "quezon city", "quezon", "q.c."].includes(value)) return "Quezon City";
  if (["manila", "mnl", "m", "tip manila"].includes(value)) return "Manila";
  return null;
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createWildcardRegex = (input: string): RegExp | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const wildcardPattern = trimmed.split("").map((char) => {
    if (char === "*") return ".*";
    if (char === "?") return ".";
    return escapeRegex(char);
  }).join("");
  try { return new RegExp(wildcardPattern, "i"); } catch { return null; }
};

// ─── Reusable Components ─────────────────────────────────────────────
const StatCard: FC<{ title: string; value: string | number; icon: ReactNode }> = ({ title, value, icon }) => (
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

// ─── Main Dashboard Component ────────────────────────────────────────
export default function DashboardHome({
  onNavigateToRecord,
}: {
  onNavigateToRecord?: (target: { formType: "Application" | "Portfolio"; id: string }) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allApplicants, setAllApplicants] = useState<Applicant[]>([]);
  const [allPortfolioSubmissions, setAllPortfolioSubmissions] = useState<PortfolioSubmission[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [chartCampus, setChartCampus] = useState<"Manila" | "Quezon City">("Manila");
  const [dataType, setDataType] = useState<"applicants" | "portfolios">("applicants");
  const [selectedChart, setSelectedChart] = useState<"volume" | "status" | "programs" | "campus" | "yearly">("volume");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [campusMetric, setCampusMetric] = useState<CampusMetric>("total");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchViewMode, setSearchViewMode] = useState<SearchViewMode>("selected");
  const [searchStatusFilter, setSearchStatusFilter] = useState<SearchStatusFilter>("All");
  const [visibleSearchCount, setVisibleSearchCount] = useState(3);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<SearchResultItem | null>(null);
  const [selectedResultDetails, setSelectedResultDetails] = useState<Record<string, any> | null>(null);

  useEffect(() => { setVisibleSearchCount(3); }, [searchTerm, dataType, searchViewMode, searchStatusFilter]);

  // ─── Data Fetching ─────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [applicationsRes, portfolioSubmissionsRes, userLoginHistoryRes, adminLoginHistoryRes] = await Promise.all([
          supabase.from("applications").select("application_id, applicant_name, created_at, status, degree_applied_for, campus"),
          supabase.from("portfolio_submissions").select("id, created_at, status, degree_program, full_name, campus"),
          supabase.from("user_login_history").select("email, user_id"),
          supabase.from("admin_login_history").select("email, admin_id"),
        ]);
        if (applicationsRes.error) throw new Error(`Applications fetch failed: ${applicationsRes.error.message}`);
        if (portfolioSubmissionsRes.error) throw new Error(`Portfolio submissions fetch failed: ${portfolioSubmissionsRes.error.message}`);
        if (userLoginHistoryRes.error) throw new Error(`User login history fetch failed: ${userLoginHistoryRes.error.message}`);
        if (adminLoginHistoryRes.error) throw new Error(`Admin login history fetch failed: ${adminLoginHistoryRes.error.message}`);

        if (isMounted) {
          setAllApplicants((applicationsRes.data || []) as Applicant[]);
          setAllPortfolioSubmissions((portfolioSubmissionsRes.data || []) as PortfolioSubmission[]);
          setTotalUsers(new Set((userLoginHistoryRes.data || []).map(l => l.email).filter(Boolean)).size);
          setTotalAdmins(new Set((adminLoginHistoryRes.data || []).map(l => l.email).filter(Boolean)).size);
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  // ─── Calculations ──────────────────────────────────────────────────
  const currentStats = useMemo(() => {
    const src = dataType === "applicants" ? allApplicants : allPortfolioSubmissions;
    return {
      total: src.length,
      approved: src.filter(a => a.status === "Approved").length,
      pending: src.filter(a => a.status === "Pending" || a.status === "Submitted").length,
      declined: src.filter(a => a.status === "Declined").length,
    };
  }, [allApplicants, allPortfolioSubmissions, dataType]);

  const filteredChartData = useMemo(() => {
    if (dataType === "applicants") {
      return allApplicants.filter(app => normalizeCampus(app.campus) === chartCampus);
    }
    return allPortfolioSubmissions;
  }, [allApplicants, allPortfolioSubmissions, chartCampus, dataType]);

  const programData = useMemo(() => {
    const byDegree = filteredChartData.reduce((acc, item) => {
      const degreeKey = dataType === "applicants" ? (item as Applicant).degree_applied_for || "N/A" : (item as PortfolioSubmission).degree_program || "N/A";
      const shortName = programMap[degreeKey] || degreeKey;
      acc[shortName] = (acc[shortName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(byDegree).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 7);
  }, [filteredChartData, dataType]);

  const statusData = useMemo(() => {
    const counts = filteredChartData.reduce((acc, item) => {
      const status = item.status || "Submitted";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return ["Approved", "Pending", "Declined", "Submitted"].map(name => ({ name, value: counts[name] || 0 })).filter(e => e.value > 0);
  }, [filteredChartData]);

  const timeSeriesData = useMemo(() => {
    const byDate = filteredChartData.reduce((acc, item) => {
      try { const d = new Date(item.created_at).toISOString().split("T")[0]; if (d) acc[d] = (acc[d] || 0) + 1; } catch { /* skip */ }
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(byDate).map(([date, count]) => ({ date, count })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredChartData]);

  const campusComparisonData = useMemo(() => {
    if (dataType !== "applicants") return [];
    const counts = allApplicants.reduce((acc, item) => {
      const key = normalizeCampus(item.campus);
      if (!key) return acc;
      const status = item.status?.trim().toLowerCase() || "submitted";
      if (campusMetric === "approved" && status !== "approved") return acc;
      if (campusMetric === "pending" && status !== "pending" && status !== "submitted") return acc;
      if (campusMetric === "declined" && status !== "declined") return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [allApplicants, dataType, campusMetric]);

  // Helper to get program short name from any item
  const getProgShortName = (item: any) => {
    const degreeKey = dataType === "applicants" ? (item as Applicant).degree_applied_for || "N/A" : (item as PortfolioSubmission).degree_program || "N/A";
    return programMap[degreeKey] || degreeKey;
  };

  // Collect all program names from filtered data
  const allFilteredProgs = useMemo(() => {
    const s = new Set<string>();
    for (const item of filteredChartData) { try { s.add(getProgShortName(item)); } catch { /* skip */ } }
    return Array.from(s);
  }, [filteredChartData, dataType]);

  const { yearlyData, yearlyPrograms } = useMemo(() => {
    const byYear: Record<string, Record<string, number>> = {};
    const programSet = new Set<string>();
    for (const item of filteredChartData) {
      try {
        const year = new Date(item.created_at).getFullYear().toString();
        const prog = getProgShortName(item);
        programSet.add(prog);
        if (!byYear[year]) byYear[year] = {};
        byYear[year][prog] = (byYear[year][prog] || 0) + 1;
      } catch { /* skip */ }
    }
    const allProgs = Array.from(programSet);
    // Pad a second year if only one exists, so lines can be drawn
    const years = Object.keys(byYear).sort();
    if (years.length === 1) {
      const padYear = String(parseInt(years[0]) + 1);
      if (!byYear[padYear]) byYear[padYear] = {};
    }
    const rows = Object.entries(byYear)
      .map(([year, progs]) => {
        const row: Record<string, any> = { year };
        allProgs.forEach(p => { row[p] = progs[p] || 0; });
        return row;
      })
      .sort((a, b) => a.year.localeCompare(b.year));
    return { yearlyData: rows, yearlyPrograms: allProgs };
  }, [filteredChartData, dataType]);

  const availableYears = useMemo(() => yearlyData.map(r => parseInt(r.year)).sort((a, b) => a - b), [yearlyData]);

  const buildMonthlyData = (filterYear?: number | null) => {
    const byMonth: Record<number, Record<string, number>> = {};
    for (const item of filteredChartData) {
      try {
        const d = new Date(item.created_at);
        if (filterYear && d.getFullYear() !== filterYear) continue;
        const month = d.getMonth();
        const prog = getProgShortName(item);
        if (!byMonth[month]) byMonth[month] = {};
        byMonth[month][prog] = (byMonth[month][prog] || 0) + 1;
      } catch { /* skip */ }
    }
    return Array.from({ length: 12 }, (_, i) => {
      const row: Record<string, any> = { month: MONTHS[i] };
      allFilteredProgs.forEach(p => { row[p] = byMonth[i]?.[p] || 0; });
      return row;
    });
  };

  const allMonthlyData = useMemo(() => buildMonthlyData(), [filteredChartData, dataType, allFilteredProgs]);
  const yearMonthlyData = useMemo(() => selectedYear ? buildMonthlyData(selectedYear) : allMonthlyData, [filteredChartData, dataType, selectedYear, allMonthlyData, allFilteredProgs]);

  const topProgram = programData[0];
  const busiestDay = useMemo(() => {
    if (!timeSeriesData.length) return null;
    return timeSeriesData.reduce((max, item) => item.count > max.count ? item : max, timeSeriesData[0]);
  }, [timeSeriesData]);
  const topCampus = useMemo(() => campusComparisonData.length ? campusComparisonData[0] : null, [campusComparisonData]);

  // ─── Search Logic ──────────────────────────────────────────────────
  const allSearchResults = useMemo(() => {
    const effectiveSearchTerm = searchTerm.trim() ? searchTerm : "*";
    const wildcard = createWildcardRegex(effectiveSearchTerm);
    const normalizedTerm = effectiveSearchTerm.trim().toLowerCase();
    if (!wildcard && !normalizedTerm) return [];

    const scoreItem = (name: string, status: string, id: string, program: string, campus: string, formType: string): number => {
      const formTypeSearchText = `${formType} type`;
      const test = (val: string) => wildcard ? wildcard.test(val) : val.toLowerCase().includes(normalizedTerm);
      return (test(name) ? 5 : 0) + (test(status) ? 4 : 0) + (test(id) ? 2 : 0) + (test(program) ? 1 : 0) + (test(campus) ? 1 : 0) + (test(formTypeSearchText) ? 1 : 0);
    };

    const applicationItems: SearchResultItem[] = allApplicants.map(app => {
      const name = app.applicant_name?.trim() || "Unnamed Applicant";
      const status = app.status || "Submitted";
      const program = app.degree_applied_for || "N/A";
      const campus = app.campus || "N/A";
      const id = app.application_id;
      return { id, formType: "Application" as const, name, status, program, campus, createdAt: app.created_at, score: scoreItem(name, status, id, program, campus, "Application") };
    }).filter(i => i.score > 0);

    const portfolioItems: SearchResultItem[] = allPortfolioSubmissions.map(p => {
      const name = p.full_name?.trim() || "Unnamed Applicant";
      const status = p.status || "Submitted";
      const program = p.degree_program || "N/A";
      const campus = p.campus || "N/A";
      const id = String(p.id);
      return { id, formType: "Portfolio" as const, name, status, program, campus, createdAt: p.created_at, score: scoreItem(name, status, id, program, campus, "Portfolio") };
    }).filter(i => i.score > 0);

    return [...applicationItems, ...portfolioItems].sort((a, b) => b.score !== a.score ? b.score - a.score : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allApplicants, allPortfolioSubmissions, searchTerm]);

  const scopedSearchResults = useMemo(() => {
    const byDataset = searchViewMode === "all" ? allSearchResults : allSearchResults.filter(i => dataType === "applicants" ? i.formType === "Application" : i.formType === "Portfolio");
    if (searchStatusFilter === "All") return byDataset;
    return byDataset.filter(i => i.status === searchStatusFilter);
  }, [allSearchResults, dataType, searchStatusFilter, searchViewMode]);

  const searchStatusCounts = useMemo(() => {
    const counts: Record<SearchStatusFilter, number> = { All: scopedSearchResults.length, Submitted: 0, Pending: 0, Approved: 0, Declined: 0 };
    scopedSearchResults.forEach(i => { const s = i.status as SearchStatusFilter; if (counts[s] !== undefined) counts[s]++; });
    return counts;
  }, [scopedSearchResults]);

  const displayedSearchResults = useMemo(() => scopedSearchResults.slice(0, visibleSearchCount), [scopedSearchResults, visibleSearchCount]);

  // ─── Detail Modal Handlers ─────────────────────────────────────────
  const openDetailsFromDashboard = async (item: SearchResultItem) => {
    setSelectedResult(item); setSelectedResultDetails(null); setDetailsError(null); setIsDetailsModalOpen(true); setDetailsLoading(true);
    try {
      if (item.formType === "Application") {
        const { data, error: e } = await supabase.from("applications").select("*").eq("application_id", item.id).single();
        if (e) throw e;
        setSelectedResultDetails(data as Record<string, any>);
      } else {
        const numericId = Number(item.id);
        if (Number.isNaN(numericId)) throw new Error("Invalid portfolio submission ID.");
        const { data, error: e } = await supabase.from("portfolio_submissions").select("*").eq("id", numericId).single();
        if (e) throw e;
        setSelectedResultDetails(data as Record<string, any>);
      }
    } catch (err) { setDetailsError(err instanceof Error ? err.message : "Failed to load details."); }
    finally { setDetailsLoading(false); }
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false); setDetailsLoading(false); setDetailsError(null); setSelectedResult(null); setSelectedResultDetails(null);
  };

  // ─── Chart Tabs Definition ─────────────────────────────────────────
  const chartTabs = [
    { id: "volume" as const, label: "Volume Trend", description: "Daily submissions over time", available: timeSeriesData.length > 0, icon: <Calendar size={16} /> },
    { id: "yearly" as const, label: "Program Trends", description: "Monthly submissions by program", available: yearlyData.length > 0, icon: <BarChart3 size={16} /> },
    { id: "status" as const, label: "Status Check", description: "Distribution by status", available: statusData.length > 0, icon: <BarChart3 size={16} /> },
    { id: "programs" as const, label: "Top Programs", description: "Top programs by count", available: programData.length > 0, icon: <GraduationCap size={16} /> },
    { id: "campus" as const, label: "Campus Comparison", description: "Applicants by campus", available: dataType === "applicants" && campusComparisonData.length > 0, icon: <ShieldUser size={16} /> },
  ];

  const activeChartId = chartTabs.some(t => t.id === selectedChart && t.available) ? selectedChart : (chartTabs.find(t => t.available)?.id ?? "volume");

  // ─── Chart Renderer ────────────────────────────────────────────────
  const renderActiveChart = () => {
    if (activeChartId === "volume") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeSeriesData} margin={{ top: 10, right: 20, left: -5, bottom: 0 }}>
            <defs><linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F4C300" stopOpacity={0.65}/><stop offset="95%" stopColor="#F4C300" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false}/>
            <XAxis dataKey="date" fontSize={11} tick={{ fill: "#6B7280" }} stroke="#D1D5DB" axisLine={false} tickLine={false} />
            <YAxis fontSize={11} tick={{ fill: "#6B7280" }} stroke="#D1D5DB" axisLine={false} tickLine={false} allowDecimals={false}/>
            <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "0.5rem" }} />
            <Area type="monotone" dataKey="count" stroke="#F4C300" fillOpacity={1} fill="url(#colorCount)" name="Submissions" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    if (activeChartId === "yearly") {
      const isYearDrilldown = selectedYear !== null;
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={isYearDrilldown ? yearMonthlyData : yearlyData} margin={{ top: 10, right: 20, left: -5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey={isYearDrilldown ? "month" : "year"} fontSize={11} tick={{ fill: "#6B7280" }} stroke="#D1D5DB" axisLine={false} tickLine={false} />
            <YAxis fontSize={11} tick={{ fill: "#6B7280" }} stroke="#D1D5DB" axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "0.5rem" }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
            {yearlyPrograms.map((prog, i) => (
              <Line key={prog} type="monotone" dataKey={prog} stroke={PROGRAM_COLORS[i % PROGRAM_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }
    if (activeChartId === "status") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} labelLine={false} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
              {statusData.map(entry => (<Cell key={`cell-${entry.name}`} fill={STATUS_COLORS[entry.name] || STATUS_COLORS["Submitted"]} className="outline-none focus:outline-none" stroke="none" />))}
            </Pie>
            <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "6px" }}/><Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    if (activeChartId === "programs") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={programData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#6B7280" }} fontSize={11} stroke="#D1D5DB" axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={70} tick={{ fill: "#6B7280" }} fontSize={11} stroke="#D1D5DB" axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "0.5rem" }}/><Bar dataKey="count" name="Count" fill="#1D4ED8" barSize={20} radius={[0, 4, 4, 0]}/>
          </BarChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={campusComparisonData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
          <XAxis type="number" tick={{ fill: "#6B7280" }} fontSize={11} stroke="#D1D5DB" axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={80} tick={{ fill: "#6B7280" }} fontSize={11} stroke="#D1D5DB" axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "0.5rem" }}/>
          <Bar dataKey="count" name={`${CAMPUS_METRIC_LABELS[campusMetric]} Applicants`} fill={CAMPUS_METRIC_COLORS[campusMetric]} barSize={24} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // ─── Render: Loading / Error ───────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)] text-gray-600">
        <Loader2 className="animate-spin mr-3 h-8 w-8" /><span className="text-lg font-medium">Loading Dashboard Data...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
        <div className="flex items-center"><AlertCircle className="h-6 w-6 mr-3" /><div><p className="font-bold">Error Loading Dashboard</p><p>{error}</p></div></div>
      </div>
    );
  }

  // ─── Render: Main Layout ───────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ═══ ROW 1: Stat Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title={dataType === "applicants" ? "Total Applications" : "Total Submissions"} value={currentStats.total} icon={<Users size={20} />} />
        <StatCard title="Approved" value={currentStats.approved} icon={<CheckCircle size={20} />} />
        <StatCard title="Pending / Submitted" value={currentStats.pending} icon={<Clock size={20} />} />
        <StatCard title="Declined" value={currentStats.declined} icon={<XCircle size={20} />} />
        <StatCard title="Total Unique Users" value={totalUsers} icon={<LogIn size={20} />} />
        <StatCard title="Total Unique Admins" value={totalAdmins} icon={<ShieldUser size={20} />} />
      </div>

      {/* ═══ ROW 2: Controls (dataset toggle, campus filter, search) ═══ */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Dataset Toggle */}
            <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-full p-1">
              <button onClick={() => setDataType("applicants")} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${dataType === "applicants" ? "bg-yellow-400 text-black shadow" : "text-gray-600 hover:bg-white"}`}>Application Submissions</button>
              <button onClick={() => setDataType("portfolios")} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${dataType === "portfolios" ? "bg-yellow-400 text-black shadow" : "text-gray-600 hover:bg-white"}`}>Portfolio Submissions</button>
            </div>
            {/* Campus Toggle (shown when not on Campus Comparison chart) */}
            {dataType === "applicants" && activeChartId !== "campus" && (
              <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-full p-1 ml-2">
                <button onClick={() => setChartCampus("Manila")} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${chartCampus === "Manila" ? "bg-white text-black shadow" : "text-gray-600 hover:bg-white"}`}>Manila</button>
                <button onClick={() => setChartCampus("Quezon City")} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${chartCampus === "Quezon City" ? "bg-white text-black shadow" : "text-gray-600 hover:bg-white"}`}>Quezon City</button>
              </div>
            )}
            {/* Campus Metric Toggle (shown only on Campus Comparison chart) */}
            {dataType === "applicants" && activeChartId === "campus" && (
              <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-full p-1 ml-2">
                {(Object.keys(CAMPUS_METRIC_LABELS) as CampusMetric[]).map(metric => (
                  <button key={metric} onClick={() => setCampusMetric(metric)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors border ${campusMetric === metric ? "text-black shadow" : "text-gray-600 hover:bg-white border-transparent"}`}
                    style={campusMetric === metric ? { backgroundColor: `${CAMPUS_METRIC_COLORS[metric]}22`, borderColor: CAMPUS_METRIC_COLORS[metric] } : undefined}
                  >{CAMPUS_METRIC_LABELS[metric]}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500">Select a dataset and switch between available visualizations.</p>

        {/* Search */}
        <div className="mt-1 border-t border-gray-100 pt-3">
          <label htmlFor="dashboard-form-search" className="text-xs font-semibold uppercase tracking-wide text-gray-500">Search Applicant Forms</label>
          <div className="mt-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input id="dashboard-form-search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder='Try name or status, e.g. Juan*, *pending, *manila*' className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Use `*` for any characters.</p>

          {/* Search Results */}
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="inline-flex items-center bg-white border border-gray-200 rounded-full p-1">
                <button onClick={() => setSearchViewMode("selected")} className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${searchViewMode === "selected" ? "bg-yellow-400 text-black shadow" : "text-gray-600 hover:bg-gray-50"}`}>Selected Dataset</button>
                <button onClick={() => setSearchViewMode("all")} className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${searchViewMode === "all" ? "bg-yellow-400 text-black shadow" : "text-gray-600 hover:bg-gray-50"}`}>All Submissions</button>
              </div>
              <p className="text-xs text-gray-500">Showing {displayedSearchResults.length} of {scopedSearchResults.length} match(es)</p>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {(["All", "Submitted", "Pending", "Approved", "Declined"] as SearchStatusFilter[]).map(status => (
                <button key={status} onClick={() => setSearchStatusFilter(status)} className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${searchStatusFilter === status ? "bg-white text-gray-900 border-yellow-400" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-white"}`}>{status} ({searchStatusCounts[status]})</button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-2.5">
              {displayedSearchResults.length > 0 ? displayedSearchResults.map(item => (
                <div key={`${item.formType}-${item.id}`} className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 whitespace-nowrap">{item.formType}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Form ID: {item.id}</p>
                  <p className="text-xs text-gray-600">Status: {item.status}</p>
                  <p className="text-xs text-gray-600">Program: {item.program}</p>
                  <p className="text-xs text-gray-600">Campus: {item.campus}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[11px] text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</p>
                    <button onClick={() => openDetailsFromDashboard(item)} className="text-xs font-semibold text-yellow-700 hover:text-yellow-800">Open Details</button>
                  </div>
                </div>
              )) : (
                <div className="lg:col-span-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-500">No matching forms found for this filter.</div>
              )}
            </div>

            {scopedSearchResults.length > displayedSearchResults.length && (
              <div className="mt-3 flex justify-center">
                <button onClick={() => setVisibleSearchCount(prev => prev + 3)} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">Show 3 more</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ ROW 3: Charts (3/4) + Quick Insights (1/4) ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">

        {/* Chart Card (spans 3 of 4 columns) */}
        <div className="xl:col-span-3 bg-white border border-gray-200 rounded-xl shadow-sm p-4 min-h-[380px]">
          {/* Chart Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-gray-100">
            {chartTabs.map(tab => (
              <button key={tab.id} disabled={!tab.available} onClick={() => tab.available && setSelectedChart(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${activeChartId === tab.id ? "border-yellow-400 bg-yellow-50 text-gray-900" : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"} ${!tab.available ? "opacity-50 cursor-not-allowed" : ""}`}
              >{tab.icon}<span>{tab.label}</span></button>
            ))}
          </div>

          {/* Chart Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">{chartTabs.find(t => t.id === activeChartId)?.label}</p>
              <p className="text-sm text-gray-500">{chartTabs.find(t => t.id === activeChartId)?.description}</p>
              {activeChartId === "yearly" && availableYears.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button onClick={() => setSelectedYear(null)} className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${selectedYear === null ? "bg-yellow-400 border-yellow-400 text-black" : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"}`}>All Years</button>
                  {availableYears.map(yr => (
                    <button key={yr} onClick={() => setSelectedYear(yr)} className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${selectedYear === yr ? "bg-yellow-400 border-yellow-400 text-black" : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"}`}>{yr}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dataType === "applicants" && activeChartId === "campus" ? CAMPUS_METRIC_COLORS[campusMetric] : "#F4C300" }}></div>
              <span>{dataType === "applicants" ? (activeChartId === "campus" ? `All campuses • ${CAMPUS_METRIC_LABELS[campusMetric]} data` : `${chartCampus} data`) : "Portfolio data"}</span>
            </div>
          </div>

          {/* Chart Body */}
          <div className="h-[320px]">
            {chartTabs.every(tab => !tab.available) ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <BarChart3 className="w-6 h-6 mb-2" /><p className="text-sm font-medium">No data available for charts yet.</p><p className="text-xs text-gray-400">Try switching the dataset or campus filter.</p>
              </div>
            ) : renderActiveChart()}
          </div>
        </div>

        {/* Quick Insights Card (spans 1 of 4 columns) */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Quick Insights</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center"><BarChart3 size={16} /></div>
              <div className="flex-1"><p className="text-sm font-semibold text-gray-800">Top Program</p><p className="text-sm text-gray-500">{topProgram ? `${topProgram.name} (${topProgram.count})` : "No data yet"}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center"><Calendar size={16} /></div>
              <div className="flex-1"><p className="text-sm font-semibold text-gray-800">Busiest Day</p><p className="text-sm text-gray-500">{busiestDay ? `${busiestDay.date} (${busiestDay.count})` : "No data yet"}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center"><ShieldUser size={16} /></div>
              <div className="flex-1"><p className="text-sm font-semibold text-gray-800">Top Campus</p><p className="text-sm text-gray-500">{topCampus ? `${topCampus.name} (${topCampus.count})` : "No campus data"}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center"><LogIn size={16} /></div>
              <div className="flex-1"><p className="text-sm font-semibold text-gray-800">Unique Users (login)</p><p className="text-sm text-gray-500">{totalUsers}</p></div>
            </div>
          </div>
        </div>

      </div>{/* end grid row 3 */}

      {/* ═══ Details Modal ═══ */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div><p className="text-lg font-bold text-gray-900">Applicant Details</p><p className="text-xs text-gray-500">{selectedResult?.formType} • {selectedResult?.id}</p></div>
              <button onClick={closeDetailsModal} className="text-gray-400 hover:text-gray-700" aria-label="Close details modal"><X size={22} /></button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {detailsLoading && (<div className="flex items-center text-gray-600"><Loader2 className="w-5 h-5 animate-spin mr-2" />Loading applicant details...</div>)}
              {!detailsLoading && detailsError && (<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{detailsError}</div>)}
              {!detailsLoading && !detailsError && selectedResultDetails && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-gray-200 p-3"><p className="text-xs text-gray-500">Name</p><p className="font-semibold text-gray-900">{selectedResultDetails.applicant_name || selectedResultDetails.full_name || selectedResult?.name || "N/A"}</p></div>
                  <div className="rounded-lg border border-gray-200 p-3"><p className="text-xs text-gray-500">Status</p><p className="font-semibold text-gray-900">{selectedResultDetails.status || selectedResult?.status || "N/A"}</p></div>
                  <div className="rounded-lg border border-gray-200 p-3"><p className="text-xs text-gray-500">Program</p><p className="font-semibold text-gray-900">{selectedResultDetails.degree_applied_for || selectedResultDetails.degree_program || selectedResult?.program || "N/A"}</p></div>
                  <div className="rounded-lg border border-gray-200 p-3"><p className="text-xs text-gray-500">Campus</p><p className="font-semibold text-gray-900">{selectedResultDetails.campus || selectedResult?.campus || "N/A"}</p></div>
                  <div className="rounded-lg border border-gray-200 p-3 sm:col-span-2"><p className="text-xs text-gray-500">Email / User</p><p className="font-semibold text-gray-900">{selectedResultDetails.email_address || selectedResultDetails.user_id || "N/A"}</p></div>
                  <div className="rounded-lg border border-gray-200 p-3 sm:col-span-2"><p className="text-xs text-gray-500">Submitted</p><p className="font-semibold text-gray-900">{selectedResultDetails.created_at ? new Date(selectedResultDetails.created_at).toLocaleString() : "N/A"}</p></div>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button onClick={closeDetailsModal} className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}