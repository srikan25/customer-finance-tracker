import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { supabase } from "../lib/supabase";

import "../styles/viewFinance.css";

const ViewFinance = ({ customer, loan, onClose }) => {
  const [emiSchedule, setEmiSchedule] = useState([]);
  const [loadingEmis, setLoadingEmis] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchEmiSchedule = async () => {
      try {
        setLoadingEmis(true);
        setErrorMessage("");

        const { data, error } = await supabase
          .from("emi_schedule")
          .select("*")
          .eq("loan_id", loan.id)
          .order("emi_number", { ascending: true });

        if (error) throw error;

        setEmiSchedule(data || []);
      } catch (error) {
        console.error("Fetch EMI schedule error:", error.message);

        setErrorMessage("Unable to load EMI schedule.");
      } finally {
        setLoadingEmis(false);
      }
    };

    fetchEmiSchedule();
  }, [loan.id]);

  const getTodayDate = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getEmiDisplayStatus = (emi) => {
    if (emi.status === "paid") {
      return "paid";
    }

    if (emi.status === "partial") {
      return "partial";
    }

    if (emi.status === "closed_by_settlement") {
      return "settled";
    }

    const today = getTodayDate();

    if (emi.due_date === today) {
      return "due-today";
    }

    if (emi.due_date < today) {
      return "overdue";
    }

    return "upcoming";
  };

  const sortedEmis = useMemo(() => {
    const unpaidEmis = [];
    const paidEmis = [];

    emiSchedule.forEach((emi) => {
      const displayStatus = getEmiDisplayStatus(emi);

      if (displayStatus === "paid" || displayStatus === "settled") {
        paidEmis.push(emi);
      } else {
        unpaidEmis.push(emi);
      }
    });

    unpaidEmis.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    paidEmis.sort((a, b) => a.emi_number - b.emi_number);

    return [...unpaidEmis, ...paidEmis];
  }, [emiSchedule]);

  const paidEmisCount = useMemo(() => {
    return emiSchedule.filter((emi) => emi.status === "paid").length;
  }, [emiSchedule]);

  const remainingEmisCount = emiSchedule.length - paidEmisCount;

  const totalPaid = useMemo(() => {
    return emiSchedule.reduce(
      (total, emi) => total + Number(emi.paid_amount || 0),
      0,
    );
  }, [emiSchedule]);

  const totalPayable = useMemo(() => {
    return emiSchedule.reduce(
      (total, emi) => total + Number(emi.amount || 0),
      0,
    );
  }, [emiSchedule]);

  const remainingAmount = Math.max(totalPayable - totalPaid, 0);

  const nextEmi = useMemo(() => {
    return emiSchedule
      .filter(
        (emi) => emi.status !== "paid" && emi.status !== "closed_by_settlement",
      )
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
  }, [emiSchedule]);

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const [year, month, day] = dateString.split("-");

    return `${day}-${month}-${year}`;
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "paid":
        return "Paid";

      case "partial":
        return "Partial";

      case "due-today":
        return "Due Today";

      case "overdue":
        return "Overdue";

      case "settled":
        return "Closed";

      default:
        return "Upcoming";
    }
  };

  return (
    <div className="view-finance-overlay" onClick={onClose}>
      <div
        className="view-finance-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="view-finance-header">
          <div>
            <span>FINANCE DETAILS</span>

            <h2>{customer.name}</h2>

            {loan.vehicle_name && <p>{loan.vehicle_name}</p>}
          </div>

          <button
            type="button"
            className="view-finance-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="view-finance-content">
          <div className="view-finance-amount-card">
            <span>Finance Amount</span>

            <strong>₹{formatAmount(loan.finance_amount)}</strong>

            <small>
              {loan.status === "closed" ? "Finance Closed" : "Active Finance"}
            </small>
          </div>

          <div className="view-finance-summary-grid">
            <div>
              <span>Total Amount</span>
              <strong>₹{formatAmount(loan.total_amount)}</strong>
            </div>

            <div>
              <span>Down Payment</span>
              <strong>₹{formatAmount(loan.down_payment)}</strong>
            </div>

            <div>
              <span>Document Charges</span>
              <strong>₹{formatAmount(loan.document_charges)}</strong>
            </div>

            <div>
              <span>Interest Rate</span>
              <strong>{loan.interest_rate || 0}%</strong>
            </div>

            <div>
              <span>Monthly EMI</span>
              <strong>₹{formatAmount(loan.emi_amount)}</strong>
            </div>

            <div>
              <span>Total EMIs</span>
              <strong>{loan.total_emis}</strong>
            </div>
          </div>

          <div className="view-finance-date-grid">
            <div>
              <span>Finance Date</span>
              <strong>{formatDate(loan.finance_date)}</strong>
            </div>

            <div>
              <span>First EMI Date</span>
              <strong>{formatDate(loan.first_emi_date)}</strong>
            </div>
          </div>

          {!loadingEmis && emiSchedule.length > 0 && (
            <div className="emi-progress-section">
              <div className="emi-progress-grid">
                <div>
                  <span>Paid EMIs</span>
                  <strong>{paidEmisCount}</strong>
                </div>

                <div>
                  <span>Remaining</span>
                  <strong>{remainingEmisCount}</strong>
                </div>

                <div>
                  <span>Total Paid</span>
                  <strong>₹{formatAmount(totalPaid)}</strong>
                </div>

                <div>
                  <span>Remaining Amount</span>
                  <strong>₹{formatAmount(remainingAmount)}</strong>
                </div>
              </div>

              {nextEmi && (
                <div className="next-emi-box">
                  <span>Next EMI</span>

                  <strong>{formatDate(nextEmi.due_date)}</strong>

                  <small>₹{formatAmount(nextEmi.amount)}</small>
                </div>
              )}
            </div>
          )}

          <div className="emi-schedule-section">
            <div className="emi-schedule-title">
              <div>
                <h3>EMI Schedule</h3>
                <p>
                  {emiSchedule.length} installment
                  {emiSchedule.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {loadingEmis && (
              <p className="emi-loading">Loading EMI schedule...</p>
            )}

            {errorMessage && <p className="emi-error">{errorMessage}</p>}

            {!loadingEmis && !errorMessage && emiSchedule.length === 0 && (
              <p className="emi-empty">No EMI schedule found.</p>
            )}

            {!loadingEmis && !errorMessage && sortedEmis.length > 0 && (
              <div className="emi-grid">
                {sortedEmis.map((emi) => {
                  const displayStatus = getEmiDisplayStatus(emi);

                  return (
                    <div key={emi.id} className={`emi-card ${displayStatus}`}>
                      <span className="emi-date">
                        {formatDate(emi.due_date)}
                      </span>

                      <strong className="emi-number">
                        EMI {emi.emi_number}
                      </strong>

                      <span className="emi-amount">
                        ₹{formatAmount(emi.amount)}
                      </span>

                      <small className="emi-status">
                        {getStatusLabel(displayStatus)}
                      </small>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewFinance;
