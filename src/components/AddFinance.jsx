import { useMemo, useState } from "react";

import { supabase } from "../lib/supabase";

import "../styles/addFinance.css";

const AddFinance = ({ customer, userId, onFinanceAdded, onClose }) => {
  const [vehicleName, setVehicleName] = useState("");

  const [totalAmount, setTotalAmount] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [documentCharges, setDocumentCharges] = useState("");

  const [interestRate, setInterestRate] = useState("");
  const [totalEmis, setTotalEmis] = useState("");

  const [financeDate, setFinanceDate] = useState("");
  const [firstEmiDate, setFirstEmiDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // =========================
  // FINANCE AMOUNT
  // =========================

  const financeAmount = useMemo(() => {
    const total = Number(totalAmount) || 0;
    const down = Number(downPayment) || 0;
    const charges = Number(documentCharges) || 0;

    return Math.max(total - down + charges, 0);
  }, [totalAmount, downPayment, documentCharges]);

  // =========================
  // CALCULATED EMI
  // =========================

  const emiAmount = useMemo(() => {
    const principal = Number(financeAmount) || 0;
    const annualInterestRate = Number(interestRate) || 0;
    const numberOfEmis = Number(totalEmis) || 0;

    if (principal <= 0 || numberOfEmis <= 0) {
      return 0;
    }

    const interest =
      principal * (annualInterestRate / 100) * (numberOfEmis / 12);

    const totalPayable = principal + interest;

    return Math.round(totalPayable / numberOfEmis);
  }, [financeAmount, interestRate, totalEmis]);

  // =========================
  // DATE HELPERS
  // =========================

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateEmiSchedule = ({ firstDate, emiCount, amount, loanId }) => {
    const [year, month, day] = firstDate.split("-").map(Number);

    const originalDay = day;

    const schedule = [];

    for (let index = 0; index < emiCount; index++) {
      const targetMonth = month - 1 + index;

      const targetYear = year + Math.floor(targetMonth / 12);

      const normalizedMonth = targetMonth % 12;

      const daysInTargetMonth = getDaysInMonth(targetYear, normalizedMonth);

      const finalDay = Math.min(originalDay, daysInTargetMonth);

      const dueDate = new Date(targetYear, normalizedMonth, finalDay);

      const formattedDate = [
        dueDate.getFullYear(),
        String(dueDate.getMonth() + 1).padStart(2, "0"),
        String(dueDate.getDate()).padStart(2, "0"),
      ].join("-");

      schedule.push({
        user_id: userId,
        customer_id: customer.id,
        loan_id: loanId,

        emi_number: index + 1,

        due_date: formattedDate,

        amount,

        status: "unpaid",

        paid_amount: 0,

        paid_date: null,
      });
    }

    return schedule;
  };

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    try {
      setLoading(true);
      setErrorMessage("");

      const total = Number(totalAmount);

      const down = Number(downPayment) || 0;

      const charges = Number(documentCharges) || 0;

      const rate = Number(interestRate) || 0;

      const numberOfEmis = Number(totalEmis);

      const finalFinanceDate =
        financeDate || new Date().toISOString().split("T")[0];

      if (!vehicleName.trim()) {
        throw new Error("Please enter the vehicle name.");
      }

      if (!totalAmount) {
        throw new Error("Please enter the total amount.");
      }

      if (total <= 0) {
        throw new Error("Total amount must be greater than 0.");
      }

      if (down < 0) {
        throw new Error("Down payment cannot be negative.");
      }

      if (down >= total) {
        throw new Error("Down payment must be less than the total amount.");
      }

      if (charges < 0) {
        throw new Error("Document charges cannot be negative.");
      }

      if (financeAmount <= 0) {
        throw new Error("Finance amount must be greater than 0.");
      }

      if (rate < 0) {
        throw new Error("Interest rate cannot be negative.");
      }

      if (!totalEmis) {
        throw new Error("Please enter the number of EMIs.");
      }

      if (!Number.isInteger(numberOfEmis) || numberOfEmis <= 0) {
        throw new Error("Total EMIs must be a positive whole number.");
      }

      if (emiAmount <= 0) {
        throw new Error("Unable to calculate EMI amount.");
      }

      if (!firstEmiDate) {
        throw new Error("Please select the first EMI date.");
      }

      if (firstEmiDate < finalFinanceDate) {
        throw new Error("First EMI date cannot be before the finance date.");
      }

      const { data: loanData, error: loanError } = await supabase
        .from("loans")
        .insert({
          user_id: userId,

          customer_id: customer.id,

          vehicle_name: vehicleName.trim(),

          total_amount: total,

          down_payment: down,

          document_charges: charges,

          finance_amount: financeAmount,

          interest_rate: rate,

          emi_amount: emiAmount,

          total_emis: numberOfEmis,

          finance_date: finalFinanceDate,

          first_emi_date: firstEmiDate,

          status: "active",

          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (loanError) {
        throw loanError;
      }

      const emiSchedule = generateEmiSchedule({
        firstDate: firstEmiDate,

        emiCount: numberOfEmis,

        amount: emiAmount,

        loanId: loanData.id,
      });

      const { error: scheduleError } = await supabase
        .from("emi_schedule")
        .insert(emiSchedule);

      if (scheduleError) {
        await supabase.from("loans").delete().eq("id", loanData.id);

        throw scheduleError;
      }

      onFinanceAdded?.(loanData);

      onClose();
    } catch (error) {
      console.error("Add finance error:", error);

      setErrorMessage(error.message || "Unable to add finance.");
    } finally {
      setLoading(false);
    }
  };

  const downPaymentError =
    totalAmount && downPayment && Number(downPayment) >= Number(totalAmount)
      ? "Down payment must be less than the total amount."
      : "";

  return (
    <div className="finance-overlay" onClick={onClose}>
      <div
        className="add-finance-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="add-finance-header">
          <div>
            <span>ADD FINANCE</span>

            <h2>{customer.name}</h2>

            <p>Create a new finance plan</p>
          </div>

          <button
            type="button"
            className="finance-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form className="add-finance-form" onSubmit={handleSubmit}>
          {/* VEHICLE */}

          <div className="finance-field">
            <label htmlFor="vehicleName">Vehicle Name</label>

            <input
              id="vehicleName"
              type="text"
              value={vehicleName}
              onChange={(event) => setVehicleName(event.target.value)}
              placeholder="Example: Honda Activa 6G"
            />
          </div>

          {/* TOTAL AMOUNT */}

          <div className="finance-field">
            <label htmlFor="totalAmount">Total Amount</label>

            <div className="money-input">
              <span>₹</span>

              <input
                id="totalAmount"
                type="number"
                min="0"
                step="1"
                value={totalAmount}
                onChange={(event) => setTotalAmount(event.target.value)}
              />
            </div>
          </div>

          {/* DOWN PAYMENT */}

          <div className="finance-field">
            <label htmlFor="downPayment">Down Payment</label>

            <div className="money-input">
              <span>₹</span>

              <input
                id="downPayment"
                type="number"
                min="0"
                step="1"
                value={downPayment}
                onChange={(event) => setDownPayment(event.target.value)}
              />
            </div>
            {downPaymentError && (
              <p className="field-error">{downPaymentError}</p>
            )}
          </div>

          {/* DOCUMENT CHARGES */}

          <div className="finance-field">
            <label htmlFor="documentCharges">Document Charges</label>

            <div className="money-input">
              <span>₹</span>

              <input
                id="documentCharges"
                type="number"
                min="0"
                step="1"
                value={documentCharges}
                onChange={(event) => setDocumentCharges(event.target.value)}
              />
            </div>
          </div>

          {/* FINANCE AMOUNT */}

          <div className="finance-calculated-box">
            <span>Finance Amount</span>

            <strong>₹{financeAmount.toLocaleString("en-IN")}</strong>

            <small>Total Amount - Down Payment + Document Charges</small>
          </div>

          {/* INTEREST */}

          <div className="finance-field">
            <label htmlFor="interestRate">
              Rate of Interest
              <span> (% per year)</span>
            </label>

            <div className="interest-input">
              <input
                id="interestRate"
                type="number"
                min="0"
                step="0.01"
                value={interestRate}
                onChange={(event) => setInterestRate(event.target.value)}
              />

              <span>%</span>
            </div>
          </div>

          {/* TOTAL EMIS */}

          <div className="finance-field">
            <label htmlFor="totalEmis">Number of EMIs</label>

            <input
              id="totalEmis"
              type="number"
              min="1"
              step="1"
              value={totalEmis}
              onChange={(event) => setTotalEmis(event.target.value)}
            />
          </div>

          {/* EMI AMOUNT */}

          <div className="finance-calculated-box emi-calculated-box">
            <span>Monthly EMI</span>

            <strong>₹{emiAmount.toLocaleString("en-IN")}</strong>

            <small>Calculated automatically</small>
          </div>

          {/* DATES */}

          <div className="finance-date-grid finance-date-row">
            <div className="finance-field">
              <label htmlFor="financeDate">Finance Date</label>

              <input
                id="financeDate"
                type="date"
                value={financeDate}
                onChange={(event) => setFinanceDate(event.target.value)}
              />
            </div>

            <div className="finance-field ">
              <label htmlFor="firstEmiDate">First EMI Date</label>

              <input
                id="firstEmiDate"
                type="date"
                value={firstEmiDate}
                onChange={(event) => setFirstEmiDate(event.target.value)}
              />
            </div>
          </div>

          {/* SUMMARY */}

          {financeAmount > 0 && totalEmis && emiAmount > 0 && (
            <div className="finance-summary">
              <div>
                <span>Finance Amount</span>

                <strong>₹{financeAmount.toLocaleString("en-IN")}</strong>
              </div>

              <div>
                <span>Interest</span>

                <strong>{Number(interestRate || 0)}%</strong>
              </div>

              <div>
                <span>EMIs</span>

                <strong>{totalEmis}</strong>
              </div>

              <div>
                <span>Monthly EMI</span>

                <strong>₹{emiAmount.toLocaleString("en-IN")}</strong>
              </div>
            </div>
          )}

          {/* ERROR */}

          {errorMessage && <p className="finance-error">{errorMessage}</p>}

          {/* SAVE */}

          <button
            type="submit"
            className="save-finance-button"
            disabled={loading}
          >
            {loading ? "Saving Finance..." : "Save Finance"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddFinance;
