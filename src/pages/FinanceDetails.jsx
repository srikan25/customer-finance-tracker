import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { supabase } from "../lib/supabase";

import "../styles/financeDetails.css";

const FinanceDetails = ({ toggleTheme, theme }) => {
  const { loanId } = useParams();
  const navigate = useNavigate();

  const [loan, setLoan] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [emiSchedule, setEmiSchedule] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [emiToPay, setEmiToPay] = useState(null);
  const [paymentDate, setPaymentDate] = useState("");

  const [deletingFinance, setDeletingFinance] = useState(false);

  const [showEditEmiDate, setShowEditEmiDate] = useState(false);
  const [newFirstEmiDate, setNewFirstEmiDate] = useState("");
  const [updatingEmiDates, setUpdatingEmiDates] = useState(false);

  const [settlingFinance, setSettlingFinance] = useState(false);

  useEffect(() => {
    const fetchFinanceDetails = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const { data: loanData, error: loanError } = await supabase
          .from("loans")
          .select("*")
          .eq("id", loanId)
          .single();

        if (loanError) throw loanError;

        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("*")
          .eq("id", loanData.customer_id)
          .single();

        if (customerError) throw customerError;

        const { data: emiData, error: emiError } = await supabase
          .from("emi_schedule")
          .select("*")
          .eq("loan_id", loanId)
          .order("emi_number", { ascending: true });

        if (emiError) throw emiError;

        setLoan(loanData);
        setCustomer(customerData);
        setEmiSchedule(emiData || []);
      } catch (error) {
        console.error("Fetch finance details error:", error.message);

        setErrorMessage("Unable to load finance details.");
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceDetails();
  }, [loanId]);

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const [year, month, day] = dateString.split("-");

    return `${day}-${month}-${year}`;
  };

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
    const pending = [];
    const completed = [];

    emiSchedule.forEach((emi) => {
      const status = getEmiDisplayStatus(emi);

      if (status === "paid" || status === "settled") {
        completed.push(emi);
      } else {
        pending.push(emi);
      }
    });

    pending.sort((a, b) => a.due_date.localeCompare(b.due_date));

    completed.sort((a, b) => a.emi_number - b.emi_number);

    return [...pending, ...completed];
  }, [emiSchedule]);

  const paidEmis = useMemo(() => {
    return emiSchedule.filter((emi) => emi.status === "paid").length;
  }, [emiSchedule]);

  const remainingEmis = useMemo(() => {
    return emiSchedule.filter(
      (emi) => emi.status !== "paid" && emi.status !== "closed_by_settlement",
    ).length;
  }, [emiSchedule]);

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

  const remainingAmount =
    loan?.status === "closed" ? 0 : Math.max(totalPayable - totalPaid, 0);

  const nextEmi = useMemo(() => {
    return emiSchedule
      .filter(
        (emi) => emi.status !== "paid" && emi.status !== "closed_by_settlement",
      )
      .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
  }, [emiSchedule]);

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
        return "Settled";

      default:
        return "Upcoming";
    }
  };

  if (loading) {
    return (
      <div className="finance-details-page">
        <p className="finance-page-message">Loading finance details...</p>
      </div>
    );
  }

  if (errorMessage || !loan || !customer) {
    return (
      <div className="finance-details-page">
        <button
          type="button"
          className="finance-back-button"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <p className="finance-page-error">
          {errorMessage || "Finance not found."}
        </p>
      </div>
    );
  }

  const handleEmiToggle = async (emi) => {
    const isPaid = emi.status === "paid";
    const nextUnpaidEmi = [...emiSchedule]
      .filter(
        (item) =>
          item.status !== "paid" && item.status !== "closed_by_settlement",
      )
      .sort((a, b) => a.emi_number - b.emi_number)[0];

    const latestPaidEmi = [...emiSchedule]
      .filter((item) => item.status === "paid")
      .sort((a, b) => b.emi_number - a.emi_number)[0];

    if (!isPaid) {
      if (!nextUnpaidEmi || nextUnpaidEmi.id !== emi.id) {
        return;
      }
    }

    if (isPaid) {
      const confirmed = window.confirm(`Mark EMI ${emi.emi_number} as unpaid?`);

      if (!confirmed) return;
    }

    try {
      const updatedStatus = isPaid ? "unpaid" : "paid";

      const updatedPaidAmount = isPaid ? 0 : Number(emi.amount);

      const updatedPaidDate = isPaid ? null : new Date().toISOString();

      const { data, error } = await supabase
        .from("emi_schedule")
        .update({
          status: updatedStatus,
          paid_amount: updatedPaidAmount,
          paid_date: updatedPaidDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", emi.id)
        .select()
        .single();

      if (error) throw error;

      const updatedSchedule = emiSchedule.map((item) =>
        item.id === emi.id ? data : item,
      );

      setEmiSchedule(updatedSchedule);

      const allPaid = updatedSchedule.every(
        (item) =>
          item.status === "paid" || item.status === "closed_by_settlement",
      );

      if (allPaid) {
        const { data: updatedLoan, error: loanError } = await supabase
          .from("loans")
          .update({
            status: "closed",
            closed_at: new Date().toISOString(),
            closure_type: "emi_completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", loan.id)
          .select()
          .single();

        if (loanError) throw loanError;

        setLoan(updatedLoan);
      }

      if (isPaid && loan.status === "closed") {
        const stillAllPaid = updatedSchedule.every(
          (item) =>
            item.status === "paid" || item.status === "closed_by_settlement",
        );

        if (!stillAllPaid) {
          const { data: reopenedLoan, error: reopenError } = await supabase
            .from("loans")
            .update({
              status: "active",
              closed_at: null,
              closure_type: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", loan.id)
            .select()
            .single();

          if (reopenError) throw reopenError;

          setLoan(reopenedLoan);
        }
      }
    } catch (error) {
      console.error("Update EMI error:", error.message);
    }
  };

  const getNextUnpaidEmiId = () => {
    const nextUnpaidEmi = [...emiSchedule]
      .filter(
        (emi) => emi.status !== "paid" && emi.status !== "closed_by_settlement",
      )
      .sort((a, b) => a.emi_number - b.emi_number)[0];

    return nextUnpaidEmi?.id;
  };

  const getLatestPaidEmiId = () => {
    const latestPaidEmi = [...emiSchedule]
      .filter((emi) => emi.status === "paid")
      .sort((a, b) => b.emi_number - a.emi_number)[0];

    return latestPaidEmi?.id;
  };

  const handleConfirmEmiPayment = async () => {
    if (!emiToPay) return;

    try {
      const paidDate = paymentDate
        ? new Date(`${paymentDate}T12:00:00`).toISOString()
        : new Date().toISOString();

      const { data, error } = await supabase
        .from("emi_schedule")
        .update({
          status: "paid",
          paid_amount: Number(emiToPay.amount),
          paid_date: paidDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", emiToPay.id)
        .select()
        .single();

      if (error) throw error;

      const updatedSchedule = emiSchedule.map((item) =>
        item.id === emiToPay.id ? data : item,
      );

      setEmiSchedule(updatedSchedule);

      const allPaid = updatedSchedule.every(
        (item) =>
          item.status === "paid" || item.status === "closed_by_settlement",
      );

      if (allPaid) {
        const { data: updatedLoan, error: loanError } = await supabase
          .from("loans")
          .update({
            status: "closed",
            closed_at: paidDate,
            closure_type: "emi_completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", loan.id)
          .select()
          .single();

        if (loanError) throw loanError;

        setLoan(updatedLoan);
      }

      setEmiToPay(null);
      setPaymentDate("");
    } catch (error) {
      console.error("Pay EMI error:", error.message);
    }
  };

  const handleDeleteFinance = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the finance for ${customer.name}?\n\nThis will also delete the complete EMI schedule and payment history.`,
    );

    if (!confirmed) return;

    try {
      setDeletingFinance(true);

      const { error } = await supabase.from("loans").delete().eq("id", loan.id);

      if (error) throw error;

      navigate("/");
    } catch (error) {
      console.error("Delete finance error:", error.message);
      alert("Unable to delete finance.");
    } finally {
      setDeletingFinance(false);
    }
  };

  const handleUpdateEmiDates = async () => {
    if (!newFirstEmiDate) {
      return;
    }

    try {
      setUpdatingEmiDates(true);

      const unpaidEmis = [...emiSchedule]
        .filter((emi) => emi.status === "unpaid")
        .sort((a, b) => a.emi_number - b.emi_number);

      if (unpaidEmis.length === 0) {
        return;
      }

      const [year, month, day] = newFirstEmiDate.split("-").map(Number);

      const originalDay = day;

      const updatedEmis = [];

      for (let index = 0; index < unpaidEmis.length; index++) {
        const targetMonth = month - 1 + index;

        const targetYear = year + Math.floor(targetMonth / 12);

        const normalizedMonth = ((targetMonth % 12) + 12) % 12;

        const daysInMonth = new Date(
          targetYear,
          normalizedMonth + 1,
          0,
        ).getDate();

        const finalDay = Math.min(originalDay, daysInMonth);

        const dueDate = [
          targetYear,
          String(normalizedMonth + 1).padStart(2, "0"),
          String(finalDay).padStart(2, "0"),
        ].join("-");

        const emi = unpaidEmis[index];

        const { data, error } = await supabase
          .from("emi_schedule")
          .update({
            due_date: dueDate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", emi.id)
          .select()
          .single();

        if (error) throw error;

        updatedEmis.push(data);
      }

      setEmiSchedule((previousSchedule) =>
        previousSchedule.map((emi) => {
          const updatedEmi = updatedEmis.find((item) => item.id === emi.id);

          return updatedEmi || emi;
        }),
      );

      setShowEditEmiDate(false);
      setNewFirstEmiDate("");
    } catch (error) {
      console.error("Update EMI dates error:", error.message);
    } finally {
      setUpdatingEmiDates(false);
    }
  };

  const handlePayTotal = async () => {
    const confirmed = window.confirm(
      `Pay the full remaining amount ₹${formatAmount(
        remainingAmount,
      )}?\n\nThis will close the finance account.`,
    );

    if (!confirmed || settlingFinance) return;

    try {
      setSettlingFinance(true);

      const settlementDate = new Date().toISOString();

      const unpaidEmis = emiSchedule.filter(
        (emi) => emi.status !== "paid" && emi.status !== "closed_by_settlement",
      );

      const unpaidIds = unpaidEmis.map((emi) => emi.id);

      if (unpaidIds.length > 0) {
        const { error: scheduleError } = await supabase
          .from("emi_schedule")
          .update({
            status: "closed_by_settlement",
            paid_date: settlementDate,
            updated_at: settlementDate,
          })
          .in("id", unpaidIds);

        if (scheduleError) throw scheduleError;
      }

      const { data: updatedLoan, error: loanError } = await supabase
        .from("loans")
        .update({
          status: "closed",
          closed_at: settlementDate,
          closure_type: "full_settlement",
          updated_at: settlementDate,
        })
        .eq("id", loan.id)
        .select()
        .single();

      if (loanError) throw loanError;

      setEmiSchedule((previousSchedule) =>
        previousSchedule.map((emi) =>
          unpaidIds.includes(emi.id)
            ? {
                ...emi,
                status: "closed_by_settlement",
                paid_date: settlementDate,
              }
            : emi,
        ),
      );

      setLoan(updatedLoan);
    } catch (error) {
      console.error("Full settlement error:", error.message);
    } finally {
      setSettlingFinance(false);
    }
  };

  return (
    <main className="finance-details-page">
      <div className="finance-page-container">
        <div className="finance-page-topbar">
          <button
            type="button"
            className="finance-back-button"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <span className={`finance-status-badge ${loan.status}`}>
            {loan.status === "closed" ? "Closed" : "Active"}
          </span>
        </div>

        <section className="finance-customer-header">
          <div>
            <span>FINANCE DETAILS</span>

            <h1>{customer.name}</h1>

            {loan.vehicle_name && <p>{loan.vehicle_name}</p>}
          </div>
        </section>

        <section className="finance-main-amount">
          <span>Finance Amount</span>

          <strong>₹{formatAmount(loan.finance_amount)}</strong>

          <small>{loan.interest_rate || 0}% yearly interest</small>
        </section>

        <section className="finance-info-grid">
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
        </section>

        <section className="finance-date-grid">
          <div>
            <span>Finance Date</span>
            <strong>{formatDate(loan.finance_date)}</strong>
          </div>

          <div>
            <span>First EMI Date</span>
            <strong>{formatDate(loan.first_emi_date)}</strong>
          </div>

          {loan.status === "closed" && loan.closed_at && (
            <div>
              <span>Closed Date</span>

              <strong>
                {new Date(loan.closed_at).toLocaleDateString("en-IN")}
              </strong>
            </div>
          )}
        </section>

        <section className="finance-payment-summary">
          <div>
            <span>Paid EMIs</span>
            <strong>{paidEmis}</strong>

            {loan.closure_type === "full_settlement" && (
              <small className="settlement-note">Remaining EMIs settled</small>
            )}
          </div>

          <div>
            <span>Remaining EMIs</span>
            <strong>{remainingEmis}</strong>
          </div>

          <div>
            <span>Total Paid</span>
            <strong>₹{formatAmount(totalPaid)}</strong>
            {loan.closure_type === "full_settlement" && (
              <small className="settlement-note">
                Full settlement completed
              </small>
            )}
          </div>

          <div>
            <span>Remaining Amount</span>
            <strong>₹{formatAmount(remainingAmount)}</strong>
            {loan.status === "active" && remainingAmount > 0 && (
              <button
                type="button"
                className="pay-total-button"
                onClick={handlePayTotal}
                disabled={settlingFinance}
              >
                {settlingFinance ? "Closing..." : "Pay Total"}
              </button>
            )}
          </div>
        </section>

        {nextEmi && (
          <section className="finance-next-emi">
            <div>
              <span>Next EMI</span>

              <strong>{formatDate(nextEmi.due_date)}</strong>
            </div>

            <strong>₹{formatAmount(nextEmi.amount)}</strong>
          </section>
        )}

        <section className="finance-emi-section">
          <div className="finance-section-heading">
            <div>
              <h2>EMI Schedule</h2>
              {loan.status === "active" && remainingEmis > 0 && (
                <button
                  type="button"
                  className="edit-emi-schedule-button"
                  onClick={() => {
                    const firstUnpaidEmi = [...emiSchedule]
                      .filter((emi) => emi.status === "unpaid")
                      .sort((a, b) => a.emi_number - b.emi_number)[0];

                    if (!firstUnpaidEmi) return;

                    setNewFirstEmiDate(firstUnpaidEmi.due_date);

                    setShowEditEmiDate(true);
                  }}
                  aria-label="Edit upcoming EMI dates"
                >
                  <Pencil size={16} />
                </button>
              )}

              <p>
                {emiSchedule.length} installment
                {emiSchedule.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {emiSchedule.length === 0 ? (
            <p className="finance-page-message">No EMI schedule found.</p>
          ) : (
            <div className="finance-emi-grid">
              {sortedEmis.map((emi) => {
                const displayStatus = getEmiDisplayStatus(emi);

                const nextUnpaidEmiId = getNextUnpaidEmiId();

                const latestPaidEmiId = getLatestPaidEmiId();

                return (
                  <div
                    key={emi.id}
                    className={`finance-emi-card ${displayStatus}`}
                  >
                    <div className="emi-card-top">
                      <span>{formatDate(emi.due_date)}</span>

                      <input
                        type="checkbox"
                        checked={emi.status === "paid"}
                        disabled={
                          emi.status === "paid"
                            ? emi.id !== latestPaidEmiId
                            : emi.id !== nextUnpaidEmiId
                        }
                        onChange={() => {
                          if (emi.status === "paid") {
                            handleEmiToggle(emi);
                            return;
                          }
                          setEmiToPay(emi);
                          setPaymentDate("");
                        }}
                        className="emi-paid-checkbox"
                      />
                    </div>

                    <strong>EMI {emi.emi_number}</strong>

                    <b>₹{formatAmount(emi.amount)}</b>

                    <small>{getStatusLabel(displayStatus)}</small>

                    {emi.status === "paid" && emi.paid_date && (
                      <p className="emi-paid-date">
                        Paid:{" "}
                        {new Date(emi.paid_date).toLocaleDateString("en-IN")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="finance-actions">
          <button
            type="button"
            className="finance-delete-button"
            onClick={handleDeleteFinance}
            disabled={deletingFinance}
          >
            <Trash2 size={16} />
            {deletingFinance ? "Deleting..." : "Delete Finance"}
          </button>
        </section>
      </div>

      {emiToPay && (
        <div className="payment-date-overlay" onClick={() => setEmiToPay(null)}>
          <div
            className="payment-date-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Mark EMI {emiToPay.emi_number} as Paid</h3>

            <p>EMI Amount: ₹{formatAmount(emiToPay.amount)}</p>

            <label>Payment Date</label>

            <input
              type="date"
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
            />

            <small>Leave the date empty to use today's date.</small>

            <div className="payment-date-actions">
              <button
                type="button"
                onClick={() => {
                  setEmiToPay(null);
                  setPaymentDate("");
                }}
              >
                Cancel
              </button>

              <button type="button" onClick={handleConfirmEmiPayment}>
                Mark Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditEmiDate && (
        <div
          className="emi-date-overlay"
          onClick={() => setShowEditEmiDate(false)}
        >
          <div
            className="emi-date-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Change EMI Date</h3>

            <p>
              Select the date for the next EMI. Remaining EMI dates will be
              updated automatically.
            </p>

            <input
              type="date"
              value={newFirstEmiDate}
              onChange={(event) => setNewFirstEmiDate(event.target.value)}
            />

            <div className="emi-date-actions">
              <button type="button" onClick={() => setShowEditEmiDate(false)}>
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdateEmiDates}
                disabled={updatingEmiDates || !newFirstEmiDate}
              >
                {updatingEmiDates ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        className="theme-toggle-btn"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>
    </main>
  );
};

export default FinanceDetails;
