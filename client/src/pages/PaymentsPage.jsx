import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentService } from '../services/paymentService';
import { residentService } from '../services/residentService';
import { flatService } from '../services/flatService';
import { StatusBadge } from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import {
  CreditCard,
  PlusCircle,
  Search,
  CheckCircle2,
  Calendar,
  Home,
  User,
  Clock,
  Info,
  AlertCircle
} from 'lucide-react';

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [residentsList, setResidentsList] = useState([]);
  const [flatsList, setFlatsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [billingPeriodFilter, setBillingPeriodFilter] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Create Dues Form State
  const [formData, setFormData] = useState({
    residentId: '',
    flatId: '',
    amount: '',
    billingPeriod: '',
    dueDate: '',
    notes: ''
  });

  // Record Receipt Form State
  const [receiptData, setReceiptData] = useState({
    status: 'Paid',
    paymentMethod: 'Bank Transfer',
    paymentReference: '',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      if (billingPeriodFilter) params.billingPeriod = billingPeriodFilter;

      const res = await paymentService.getPayments(params);
      if (res.success && Array.isArray(res.data)) {
        setPayments(res.data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, billingPeriodFilter]);

  useEffect(() => {
    if (user?.role === 'admin') {
      residentService.getResidents({ limit: 100 }).then((res) => {
        if (res.success) setResidentsList(res.data || []);
      });
      flatService.getFlats({ limit: 100 }).then((res) => {
        if (res.success) setFlatsList(res.data || []);
      });
    }
  }, [user]);

  const handleResidentSelect = (rId) => {
    const resident = residentsList.find((r) => r._id === rId);
    setFormData((prev) => ({
      ...prev,
      residentId: rId,
      flatId: resident?.flat?._id || resident?.flat || prev.flatId
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      setSubmitting(true);
      await paymentService.createPayment({
        residentId: formData.residentId,
        flatId: formData.flatId,
        amount: Number(formData.amount),
        billingPeriod: formData.billingPeriod.trim(),
        dueDate: new Date(formData.dueDate),
        notes: formData.notes.trim()
      });
      setCreateModalOpen(false);
      setFormData({
        residentId: '',
        flatId: '',
        amount: '',
        billingPeriod: '',
        dueDate: '',
        notes: ''
      });
      fetchPayments();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to create payment due.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReceiptModal = (payment) => {
    setSelectedPayment(payment);
    setReceiptData({
      status: 'Paid',
      paymentMethod: payment.paymentMethod || 'Bank Transfer',
      paymentReference: payment.paymentReference || '',
      notes: payment.notes || ''
    });
    setErrorMessage('');
    setUpdateModalOpen(true);
  };

  const handleReceiptSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setErrorMessage('');
    try {
      setSubmitting(true);
      await paymentService.updatePaymentStatus(selectedPayment._id, {
        status: receiptData.status,
        paymentMethod: receiptData.paymentMethod,
        paymentReference: receiptData.paymentReference.trim(),
        notes: receiptData.notes.trim()
      });
      setUpdateModalOpen(false);
      fetchPayments();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || 'Failed to update payment record.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalDues = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const paidDues = payments
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingDues = payments
    .filter((p) => p.status === 'Pending' || p.status === 'Overdue')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-accent">
            Estate Financials
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 mt-1">
            Maintenance Fee Records
          </h1>
          <p className="text-xs sm:text-sm text-navy-800/70 mt-1">
            Transparent tracking of society maintenance schedules, dues, and offline receipts.
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => {
              setErrorMessage('');
              setCreateModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Generate Dues Record
          </button>
        )}
      </div>

      {/* Honest Operational Notice */}
      <div className="p-4 rounded-2xl bg-ivory-100/90 border border-ivory-300 flex items-start space-x-3 text-xs text-navy-900">
        <Info className="w-5 h-5 text-teal-accent shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-navy-900">Manual Accounting Record Ledger</p>
          <p className="text-navy-800/70 leading-relaxed font-light">
            Maintenance records represent billing schedules and manually recorded payment receipts (Bank Transfer, Cheque, UPI, or Cash). Direct credit card processing or live payment gateways are not active in Version 1.
          </p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-navy-800/60 uppercase tracking-wider">Total Billed</p>
            <p className="font-display text-2xl font-bold text-navy-900 mt-1">
              ${totalDues.toLocaleString()}
            </p>
            <span className="text-[11px] text-navy-800/60 font-medium">{payments.length} ledger entries</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-900 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-navy-800/60 uppercase tracking-wider">Settled & Paid</p>
            <p className="font-display text-2xl font-bold text-emerald-700 mt-1">
              ${paidDues.toLocaleString()}
            </p>
            <span className="text-[11px] text-emerald-700 font-medium">Verified receipts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-navy-800/60 uppercase tracking-wider">Outstanding Dues</p>
            <p className="font-display text-2xl font-bold text-amber-700 mt-1">
              ${pendingDues.toLocaleString()}
            </p>
            <span className="text-[11px] text-amber-700 font-medium">Pending collection</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-ivory-300 shadow-subtle flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-ivory-50 border border-ivory-200 rounded-lg text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-teal-accent"
          >
            <option value="">All Payment Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid (Settled)</option>
            <option value="Overdue">Overdue</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <input
            type="text"
            value={billingPeriodFilter}
            onChange={(e) => setBillingPeriodFilter(e.target.value)}
            placeholder="Filter billing period (e.g. October)..."
            className="px-3 py-2 bg-ivory-50 border border-ivory-200 rounded-lg text-xs text-navy-900 placeholder-navy-800/40 focus:outline-none focus:ring-1 focus:ring-teal-accent"
          />
        </div>

        <span className="text-xs text-navy-800/60 font-medium">
          Showing {payments.length} payment records
        </span>
      </div>

      {/* Payment Ledger Table */}
      {loading ? (
        <LoadingSpinner message="Loading financial billing records..." />
      ) : payments.length > 0 ? (
        <div className="bg-white rounded-2xl border border-ivory-300 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-100/70 text-navy-800/70 uppercase tracking-wider font-semibold border-b border-ivory-200">
                <tr>
                  <th className="py-3.5 px-6">Billing Period</th>
                  <th className="py-3.5 px-6">Apartment Unit</th>
                  <th className="py-3.5 px-6">Resident Account</th>
                  <th className="py-3.5 px-6">Charge Amount</th>
                  <th className="py-3.5 px-6">Due Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Receipt Reference</th>
                  {user?.role === 'admin' && <th className="py-3.5 px-6 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200 text-navy-900">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-ivory-50/70 transition">
                    <td className="py-4 px-6 font-semibold text-sm text-navy-900">
                      {p.billingPeriod}
                    </td>

                    <td className="py-4 px-6 font-medium text-navy-800">
                      {p.flat ? `${p.flat.building} - Unit ${p.flat.flatNumber}` : 'General'}
                    </td>

                    <td className="py-4 px-6 text-navy-800">
                      {p.resident?.name || 'Resident'}
                    </td>

                    <td className="py-4 px-6 font-bold text-navy-900 text-sm">
                      ${Number(p.amount).toLocaleString()}
                    </td>

                    <td className="py-4 px-6 text-navy-800">
                      {new Date(p.dueDate).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-6">
                      <StatusBadge status={p.status} />
                    </td>

                    <td className="py-4 px-6 text-navy-800 font-mono text-[11px]">
                      {p.paymentReference ? (
                        <div>
                          <span>{p.paymentReference}</span>
                          <span className="block text-[10px] text-navy-800/50">{p.paymentMethod}</span>
                        </div>
                      ) : (
                        <span className="text-navy-800/40 italic">Awaiting settlement</span>
                      )}
                    </td>

                    {user?.role === 'admin' && (
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenReceiptModal(p)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-accent hover:bg-teal-50 border border-teal-200 transition"
                        >
                          Record Receipt
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Payment Records Found"
          description="There are currently no maintenance dues matching the query."
          actionText={user?.role === 'admin' ? 'Generate Maintenance Dues' : null}
          onAction={() => setCreateModalOpen(true)}
        />
      )}

      {/* Create Dues Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Generate Maintenance Charge"
        subtitle="Create an official maintenance fee record for a resident flat"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Resident *
              </label>
              <select
                required
                value={formData.residentId}
                onChange={(e) => handleResidentSelect(e.target.value)}
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              >
                <option value="">Select resident...</option>
                {residentsList.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Flat Unit *
              </label>
              <select
                required
                value={formData.flatId}
                onChange={(e) => setFormData({ ...formData, flatId: e.target.value })}
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              >
                <option value="">Select flat unit...</option>
                {flatsList.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.building} - Unit {f.flatNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Amount ($) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="250"
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Billing Period *
              </label>
              <input
                type="text"
                required
                value={formData.billingPeriod}
                onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
                placeholder="November 2026"
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
              Accounting Notes
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Standard monthly society maintenance fee"
              className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-ivory-200">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-navy-800 hover:bg-ivory-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-xl shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Generating...' : 'Record Dues'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Manual Payment Receipt Modal */}
      {selectedPayment && (
        <Modal
          isOpen={updateModalOpen}
          onClose={() => setUpdateModalOpen(false)}
          title={`Record Receipt for ${selectedPayment.billingPeriod}`}
          subtitle={`Amount: $${selectedPayment.amount} | Resident: ${selectedPayment.resident?.name || 'Resident'}`}
        >
          <form onSubmit={handleReceiptSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                  Payment Status *
                </label>
                <select
                  value={receiptData.status}
                  onChange={(e) => setReceiptData({ ...receiptData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
                >
                  <option value="Paid">Paid (Settled)</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                  Settlement Method
                </label>
                <select
                  value={receiptData.paymentMethod}
                  onChange={(e) => setReceiptData({ ...receiptData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash Receipt</option>
                  <option value="Credit Card">Credit Card (External)</option>
                  <option value="Debit Card">Debit Card (External)</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Transaction Reference / Cheque No.
              </label>
              <input
                type="text"
                value={receiptData.paymentReference}
                onChange={(e) => setReceiptData({ ...receiptData, paymentReference: e.target.value })}
                placeholder="e.g. TXN-98432104 or Cheque #102938"
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1">
                Verification Notes
              </label>
              <input
                type="text"
                value={receiptData.notes}
                onChange={(e) => setReceiptData({ ...receiptData, notes: e.target.value })}
                placeholder="e.g. Verified deposit against society bank ledger"
                className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded-lg text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-accent"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-ivory-200">
              <button
                type="button"
                onClick={() => setUpdateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-navy-800 hover:bg-ivory-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-teal-accent hover:bg-teal-light rounded-xl shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Recording...' : 'Save Receipt'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
