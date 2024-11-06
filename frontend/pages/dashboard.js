import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabaseClient';
import { CheckCircle, XCircle, Lock, Shield, Clock, AlertCircle, LogOut } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [tables, setTables] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchRLSStatus = async () => {
    try {
      const res = await fetch('/api/rls-status');
      const data = await res.json();
      setTables(data.tables);
    } catch (error) {
      console.error("Failed to fetch RLS status:", error);
    }
  };

  const fetchPITRStatusForAllProjects = async () => {
    try {
      const res = await fetch('/api/pitr-status');
      const data = await res.json();
      setProjects(data.projects);
    } catch (error) {
      console.error("Failed to fetch PITR status for projects:", error);
    }
  };

  useEffect(() => {
    const session = supabase.auth.getSession();
    setUser(session?.user ?? null);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    const fetchData = async () => {
      await fetchUsers();
      await fetchRLSStatus();
      await fetchPITRStatusForAllProjects();
      setLoading(false);
    };

    fetchData();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getMFAStats = () => {
    const passing = users.filter(u => u.mfaEnabled).length;
    const total = users.length;
    return { passing, failing: total - passing, total };
  };

  const getRLSStats = () => {
    const passing = tables.filter(t => t.rls_enabled).length;
    const total = tables.length;
    return { passing, failing: total - passing, total };
  };

  const getPITRStats = () => {
    const passing = projects.filter(p => p.pitrEnabled).length;
    const total = projects.length;
    return { passing, failing: total - passing, total };
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-white">Loading...</p>
      </div>
    );

  const tabOptions = [
    { id: 'overview', label: 'Overview', icon: AlertCircle },
    { id: 'mfa', label: 'MFA Status', icon: Lock },
    { id: 'rls', label: 'RLS Status', icon: Shield },
    { id: 'pitr', label: 'PITR Status', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="border-b border-gray-800 p-4 bg-gradient-to-r from-gray-800 to-gray-900 backdrop-blur supports-[backdrop-filter]:bg-gray-800/50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {/* Add your logo image here */}
            {/* <img src="/logo.svg" alt="Logo" className="h-8 w-8" /> */}
            <h1 className="text-2xl font-bold">Supabase Compliance Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md transition-colors duration-200 ease-in-out flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 rounded-lg p-1 flex space-x-1">
            {tabOptions.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ease-in-out ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Centered Content Container */}
        <div className="max-w-7xl mx-auto">
          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* MFA Card */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 shadow-xl border border-gray-700 hover:border-gray-500 transition-colors">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-medium">Multi-Factor Authentication</h3>
                  <Lock className="h-4 w-4 text-blue-400" />
                </div>
                <ComplianceStats stats={getMFAStats()} />
              </div>

              {/* RLS Card */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 shadow-xl border border-gray-700 hover:border-gray-500 transition-colors">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-medium">Row Level Security</h3>
                  <Shield className="h-4 w-4 text-blue-400" />
                </div>
                <ComplianceStats stats={getRLSStats()} />
              </div>

              {/* PITR Card */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 shadow-xl border border-gray-700 hover:border-gray-500 transition-colors">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-medium">Point in Time Recovery</h3>
                  <Clock className="h-4 w-4 text-blue-400" />
                </div>
                <ComplianceStats stats={getPITRStats()} />
              </div>
            </div>
          )}

          {/* Enhanced Table Layouts for other tabs */}
          {(activeTab === 'mfa' || activeTab === 'rls' || activeTab === 'pitr') && (
            <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  {activeTab === 'mfa' && <Lock className="h-5 w-5 text-blue-400" />}
                  {activeTab === 'rls' && <Shield className="h-5 w-5 text-blue-400" />}
                  {activeTab === 'pitr' && <Clock className="h-5 w-5 text-blue-400" />}
                  <h2 className="text-xl font-semibold">
                    {activeTab === 'mfa' && 'Multi-Factor Authentication Status'}
                    {activeTab === 'rls' && 'Row Level Security Status'}
                    {activeTab === 'pitr' && 'Point in Time Recovery Status'}
                  </h2>
                </div>

                <div className="relative overflow-hidden rounded-lg border border-gray-700">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-700/50 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-300">
                            {activeTab === 'mfa' && 'Email'}
                            {activeTab === 'rls' && 'Table Name'}
                            {activeTab === 'pitr' && 'Project Name'}
                          </th>
                          <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-300">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700 bg-gray-800">
                        {activeTab === 'mfa' &&
                          users.map((user, i) => (
                            <TableRow key={i} name={user.email} enabled={user.mfaEnabled} />
                          ))}
                        {activeTab === 'rls' &&
                          tables.map((table, i) => (
                            <TableRow key={i} name={table.table_name} enabled={table.rls_enabled} />
                          ))}
                        {activeTab === 'pitr' &&
                          projects.map((project, i) => (
                            <TableRow key={i} name={project.projectName} enabled={project.pitrEnabled} />
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ComplianceStats({ stats }) {
  const percentage = Math.round((stats.passing / stats.total) * 100) || 0;

  return (
    <div>
      <div className="text-2xl font-bold mt-4">{percentage}% Compliant</div>
      <p className="text-xs text-gray-400">
        {stats.passing} passing, {stats.failing} failing out of {stats.total}
      </p>
      <div className="mt-4 h-2 w-full bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
          } transition-all duration-500 ease-in-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function TableRow({ name, enabled }) {
  return (
    <tr className="hover:bg-gray-700 hover:scale-[1.02] transition-transform duration-200">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{name}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge enabled={enabled} />
      </td>
    </tr>
  );
}

function StatusBadge({ enabled }) {
  return (
    <div
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold
        ${enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
      `}
    >
      {enabled ? (
        <>
          <CheckCircle className="h-4 w-4 mr-2" />
          <span>Enabled</span>
        </>
      ) : (
        <>
          <XCircle className="h-4 w-4 mr-2" />
          <span>Not Enabled</span>
        </>
      )}
    </div>
  );
}
