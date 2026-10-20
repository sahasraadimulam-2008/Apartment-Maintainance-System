import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../services/complaintService';
import { flatService } from '../services/flatService';
import { residentService } from '../services/residentService';
import { staffService } from '../services/staffService';
import { paymentService } from '../services/paymentService';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Building2,
  Users,
  ClipboardList,
  Wrench,
  CreditCard,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    flatsCount: 0,
    residentsCount: 0,
    complaintsCount: 0,
    openComplaintsCount: 0,
    staffCount: 0,
    pendingPaymentsAmount: 0
  });

  const [recentComplaints, setRecentComplaints] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [flatsRes, residentsRes, complaintsRes, staffRes, paymentsRes] =
          await Promise.allSettled([
            flatService.getFlats({ limit: 100 }),
            residentService.getResidents({ limit: 100 }),
            complaintService.getComplaints({ limit: 50 }),
            staffService.getStaff({ limit: 100 }),
            paymentService.getPayments({ limit: 100 })
          ]);

        const flats = flatsRes.status === 'fulfilled' ? flatsRes.value.data || [] : [];
        const residents = residentsRes.status === 'fulfilled' ? residentsRes.value.data || [] : [];
        const complaints = complaintsRes.status === 'fulfilled' ? complaintsRes.value.data || [] : [];
        const staff = staffRes.status === 'fulfilled' ? staffRes.value.data || [] : [];
        const payments = paymentsRes.status === 'fulfilled' ? paymentsRes.value.data || [] : [];

        const openComplaints = complaints.filter((c) => c.status === 'Open' || c.status === 'In Progress');
        const pendingTotal = payments
          .filter((p) => p.status === 'Pending' || p.status === 'Overdue')
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        setStats({
          flatsCount: flats.length,
          residentsCount: residents.length,
          complaintsCount: complaints.length,
          openComplaintsCount: openComplaints.length,
          staffCount: staff.length,
          pendingPaymentsAmount: pendingTotal
        });

        setRecentComplaints(complaints.slice(0, 5));

        // Aggregate by Category
        const catMap = {};
        complaints.forEach((c) => {
          const cat = c.category || 'General';
          catMap[cat] = (catMap[cat] || 0) + 1;
        });
        const catArray = Object.keys(catMap).map((k) => ({
          name: k,
          count: catMap[k]
        }));
        setCategoryData(catArray);

        // Aggregate by Status
        const statusMap = {};
        complaints.forEach((c) => {
          const s = c.status || 'Open';
          statusMap[s] = (statusMap[s] || 0) + 1;
        });
        const statusArray = Object.keys(statusMap).map((k) => ({
          name: k,
          value: statusMap[k]
        }));
        setStatusData(statusArray);
      } catch (err) {
        console.error('Error fetching admin overview:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const COLORS = ['#0D9488', '#F59E0B', '#25397A', '#10B981', '#E11D48'];

  if (loading) {
    return <LoadingSpinner message="Aggregating estate management analytics..." />;
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-accent">
            Society Administration
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 mt-1">
            Executive Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-navy-800/70 mt-1">
            Live overview of maintenance complaints, facility staff, residential inventory, and dues.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/complaints"
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-navy-900 text-ivory-50 hover:bg-navy-800 transition shadow-sm"
          >
            Review Complaints
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-navy-800/60 uppercase tracking-wider">
              Total Flats
            </span>
            <div className="p-2 bg-ivory-100 rounded-lg text-navy-900">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-navy-900 mt-3">
            {stats.flatsCount}
          </p>
          <div className="mt-2 text-xs text-navy-800/60 flex items-center">
            <Link to="/flats" className="text-teal-accent font-medium hover:underline inline-flex items-center">
              Manage units <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-navy-800/60 uppercase tracking-wider">
              Active Residents
            </span>
            <div className="p-2 bg-teal-50 rounded-lg text-teal-accent">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-navy-900 mt-3">
            {stats.residentsCount}
          </p>
          <div className="mt-2 text-xs text-navy-800/60 flex items-center">
            <Link to="/residents" className="text-teal-accent font-medium hover:underline inline-flex items-center">
              Resident directory <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-navy-800/60 uppercase tracking-wider">
              Open Complaints
            </span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-accent">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-navy-900 mt-3">
            {stats.openComplaintsCount}
          </p>
          <div className="mt-2 text-xs text-navy-800/60">
            <span>{stats.complaintsCount} total tickets filed</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-navy-800/60 uppercase tracking-wider">
              Pending Dues
            </span>
            <div className="p-2 bg-navy-50 rounded-lg text-navy-800">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-navy-900 mt-3">
            ${stats.pendingPaymentsAmount.toLocaleString()}
          </p>
          <div className="mt-2 text-xs text-navy-800/60 flex items-center">
            <Link to="/payments" className="text-teal-accent font-medium hover:underline inline-flex items-center">
              View records <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-ivory-300 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-base text-navy-900">
                Complaints by Maintenance Category
              </h3>
              <p className="text-xs text-navy-800/60">
                Frequency distribution across residential specializations
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFECE2" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#16234D' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#16234D' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B132B',
                      color: '#FDFBF7',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" fill="#0D9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-navy-800/50">
                No complaint category metrics available yet.
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="font-display font-semibold text-base text-navy-900">
              Resolution Pipeline
            </h3>
            <p className="text-xs text-navy-800/60 mb-2">
              Current operational state of service requests
            </p>
          </div>

          <div className="h-48 w-full">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B132B',
                      color: '#FDFBF7',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-navy-800/50">
                No tickets to display.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-ivory-200">
            {statusData.map((item, idx) => (
              <div key={item.name} className="flex items-center text-xs text-navy-800/80">
                <span
                  className="w-2.5 h-2.5 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="truncate">{item.name}:</span>
                <span className="ml-1 font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Complaints Table */}
      <div className="bg-white rounded-2xl border border-ivory-300 shadow-subtle overflow-hidden">
        <div className="px-6 py-5 border-b border-ivory-200 flex items-center justify-between bg-ivory-50/50">
          <div>
            <h3 className="font-display font-semibold text-base text-navy-900">
              Active Maintenance Requests
            </h3>
            <p className="text-xs text-navy-800/70">
              Latest service requests requiring supervisor attention
            </p>
          </div>
          <Link
            to="/complaints"
            className="text-xs font-semibold text-teal-accent hover:text-teal-light flex items-center"
          >
            View All Complaints
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory-100/70 text-navy-800/70 uppercase tracking-wider font-semibold border-b border-ivory-200">
              <tr>
                <th className="py-3 px-6">Ticket Title</th>
                <th className="py-3 px-6">Flat Unit</th>
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-6">Priority</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200 text-navy-900">
              {recentComplaints.length > 0 ? (
                recentComplaints.map((c) => (
                  <tr key={c._id} className="hover:bg-ivory-50/80 transition">
                    <td className="py-3.5 px-6 font-medium">
                      <p className="text-navy-900 font-semibold truncate max-w-xs">{c.title}</p>
                      <p className="text-[11px] text-navy-800/50 truncate max-w-xs">{c.description}</p>
                    </td>
                    <td className="py-3.5 px-6 font-medium text-navy-800">
                      {c.flat ? `${c.flat.building} - ${c.flat.flatNumber}` : 'N/A'}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded bg-ivory-200 font-medium text-navy-850">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        to="/complaints"
                        className="inline-flex items-center text-xs font-semibold text-teal-accent hover:text-teal-light"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-navy-800/60">
                    No active maintenance complaints recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
