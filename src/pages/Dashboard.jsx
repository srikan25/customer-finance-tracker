import { useEffect, useRef, useState } from "react";

import { supabase } from "../lib/supabase";

import AddCustomer from "../components/AddCustomer";
import EditCustomer from "../components/EditCustomer";
import AddFinance from "../components/AddFinance";

import "../styles/dashboard.css";

import {
  CreditCard,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = ({ session, toggleTheme, theme }) => {
  const [customers, setCustomers] = useState([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [visibleAadharNumber, setVisibleAdharNumber] = useState(null);

  const [customerToEdit, setCustomerToEdit] = useState(null);

  const [customerFinance, setCustomerFinance] = useState(null);

  const [customerLoans, setCustomerLoans] = useState({});
  const [customerNextEmis, setCustomerNextEmis] = useState({});

  const [activeSearch, setActiveSearch] = useState("");
  const [closedSearch, setClosedSearch] = useState("");

  const profileRef = useRef();

  const navigate = useNavigate();

  const [userName, setUserName] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [updatingName, setUpdatingName] = useState(false);

  //
  // ________FETCH CUSTOMERS_________
  //

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // console.log("Customers fetched:", data);

      setCustomers(data || []);
    } catch (error) {
      console.error("Fetch customers error:", error);

      setErrorMessage(error.message || "Unable to load customers.");
    } finally {
      setLoadingCustomers(false);
    }
  };

  //
  // __________FETCH CUSTOMER LOANS____________
  //

  const fetchCustomerLoans = async () => {
    try {
      const { data, error } = await supabase.from("loans").select("*");

      if (error) throw error;

      // console.log("Loans fetched:", data);

      const loansByCustomer = {};

      (data || []).forEach((loan) => {
        loansByCustomer[loan.customer_id] = loan;
      });

      setCustomerLoans(loansByCustomer);

      const activeLoans = (data || []).filter(
        (loan) => loan.status === "active",
      );

      if (activeLoans.length === 0) {
        setCustomerNextEmis({});
        return;
      }

      const activeLoanIds = activeLoans.map((loan) => loan.id);

      const { data: emiData, error: emiError } = await supabase
        .from("emi_schedule")
        .select("*")
        .in("loan_id", activeLoanIds)
        .in("status", ["unpaid", "partial"])
        .order("due_date", { ascending: true });

      if (emiError) throw emiError;

      const nextEmisByCustomer = {};

      activeLoans.forEach((loan) => {
        const nextEmi = (emiData || []).find((emi) => emi.loan_id === loan.id);

        if (nextEmi) {
          nextEmisByCustomer[loan.customer_id] = nextEmi;
        }
      });

      setCustomerNextEmis(nextEmisByCustomer);
    } catch (error) {
      console.error("Fetch customer loans error:", error.message);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchCustomerLoans();
    fetchUserName();
  }, []);

  //
  // __CLOSE PROFILE ON OUTSIDE CLICK__
  //

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //
  // ______ADD CUSTOMER_______
  //

  const handleCustomerAdded = (newCustomer) => {
    setCustomers((previousCustomers) => [newCustomer, ...previousCustomers]);
  };

  //
  // ________UPDATE CUSTOMER_________
  //

  const handleCustomerUpdated = (updatedCustomer) => {
    setCustomers((previousCustomers) =>
      previousCustomers.map((customer) =>
        customer.id === updatedCustomer.id ? updatedCustomer : customer,
      ),
    );
  };

  //
  // _______FINANCE ADDED_________
  //

  const handleFinanceAdded = (loan) => {
    // console.log("Finance added:", loan);

    setCustomerLoans((previousLoans) => ({
      ...previousLoans,
      [loan.customer_id]: loan,
    }));
  };

  //
  // _________FINANCE BUTTON____________
  //

  const handleFinanceButton = (customer) => {
    const loan = customerLoans[customer.id];

    if (loan) {
      navigate(`/finance/${loan.id}`);
      return;
    }

    setCustomerFinance(customer);
  };

  //
  // ________LOGOUT___________
  //

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  //
  // _________DELETE CUSTOMER_____________
  //

  const handleDeleteCustomerButton = async (customer) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${customer.name}?\n\nThis will also remove the customer's finance and payment details.`,
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customer.id);

      if (error) throw error;

      setCustomers((previousCustomers) =>
        previousCustomers.filter((item) => item.id !== customer.id),
      );

      setCustomerLoans((previousLoans) => {
        const updatedLoans = { ...previousLoans };

        delete updatedLoans[customer.id];

        return updatedLoans;
      });
    } catch (error) {
      console.error("Delete customer error:", error.message);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      alert("please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setUpdatingPassword(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      alert("Password changed successfully.");
    } catch (error) {
      console.error("Password update error:", error);
      alert(error.message || "Failed to change password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleChangeName = async () => {
    if (!newName.trim()) {
      alert("please enter your name");
      return;
    }

    try {
      setUpdatingName(true);

      const { error } = await supabase.auth.updateUser({
        data: {
          name: newName.trim(),
        },
      });

      if (error) throw error;

      setUserName(newName.trim());
      setShowNameModal(false);
      setNewName("");
    } catch (error) {
      console.error("Name update error:", error);
      alert(error.message || "Failed to update name.");
    } finally {
      setUpdatingName(false);
    }
  };

  const getCustomerDueInfo = (customer) => {
    const loan = customerLoans[customer.id];
    const nextEmi = customerNextEmis[customer.id];

    if (!loan || loan.status === "closed" || !nextEmi) {
      return {
        type: "normal",
        priority: 3,
        message: "",
        dueDate: null,
      };
    }

    const today = new Date();

    const todayDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const tomorrowDate = [
      tomorrow.getFullYear(),
      String(tomorrow.getMonth() + 1).padStart(2, "0"),
      String(tomorrow.getDate()).padStart(2, "0"),
    ].join("-");

    if (nextEmi.due_date < todayDate) {
      const [dueYear, dueMonth, dueDay] = nextEmi.due_date
        .split("-")
        .map(Number);

      const [todayYear, todayMonth, todayDay] = todayDate
        .split("-")
        .map(Number);

      const dueTime = Date.UTC(dueYear, dueMonth - 1, dueDay);

      const todayTime = Date.UTC(todayYear, todayMonth - 1, todayDay);

      const daysOverdue = Math.floor(
        (todayTime - dueTime) / (1000 * 60 * 60 * 24),
      );

      return {
        type: "overdue",
        priority: 0,
        message:
          daysOverdue === 1
            ? "Payment overdue by 1 day"
            : `Payment overdue by ${daysOverdue} days`,
        dueDate: nextEmi.due_date,
      };
    }

    if (nextEmi.due_date === todayDate) {
      return {
        type: "due-today",
        priority: 1,
        message: "Payment due today",
        dueDate: nextEmi.due_date,
      };
    }

    if (nextEmi.due_date === tomorrowDate) {
      return {
        type: "due-tomorrow",
        priority: 2,
        message: "Payment due tomorrow",
        dueDate: nextEmi.due_date,
      };
    }

    return {
      type: "normal",
      priority: 3,
      message: "",
      dueDate: nextEmi.due_date,
    };
  };

  const activeCustomers = customers
    .filter((customer) => customerLoans[customer.id]?.status !== "closed")
    .sort((customerA, customerB) => {
      const dueA = getCustomerDueInfo(customerA);
      const dueB = getCustomerDueInfo(customerB);

      if (dueA.priority !== dueB.priority) {
        return dueA.priority - dueB.priority;
      }

      if (dueA.type === "overdue" && dueB.type === "overdue") {
        return dueA.dueDate.localeCompare(dueB.dueDate);
      }

      return 0;
    });

  const closedCustomers = customers.filter(
    (customer) => customerLoans[customer.id]?.status === "closed",
  );

  const filteredActiveCustomers = activeCustomers.filter((customer) =>
    customer.name.toLowerCase().includes(activeSearch.trim().toLowerCase()),
  );

  const filteredClosedCustomers = closedCustomers.filter((customer) =>
    customer.name.toLowerCase().includes(closedSearch.trim().toLowerCase()),
  );

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const [year, month, day] = dateString.split("-");

    return `${day}-${month}-${year}`;
  };

  const fetchUserName = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      setUserName(user?.user_metadata?.name || "");
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  };

  const renderCustomerCard = (customer) => {
    const hasFinance = Boolean(customerLoans[customer.id]);
    const dueInfo = getCustomerDueInfo(customer);
    const nextEmi = customerNextEmis[customer.id];

    return (
      <div className={`customer-card ${dueInfo.type}`} key={customer.id}>
        <button
          type="button"
          className="customer-delete"
          onClick={() => handleDeleteCustomerButton(customer)}
          aria-label={`Delete ${customer.name}`}
        >
          <Trash2 size={18} />
        </button>

        <h3>{customer.name}</h3>
        {dueInfo.message && (
          <div className={`customer-due-alert ${dueInfo.type}`}>
            {dueInfo.message}
          </div>
        )}

        <p>
          <strong>Mobile:</strong> {customer.mobile_number}
        </p>

        <div className="aadhaar-row">
          <p>
            <strong>Aadhaar:</strong>{" "}
            {visibleAadharNumber === customer.id
              ? customer.aadhaar_number.replace(/(\d{4})(?=\d)/g, "$1 ")
              : `XXXX XXXX ${customer.aadhaar_number.slice(-4)}`}
          </p>

          <button
            type="button"
            className="aadhaar-eye-button"
            onClick={(e) => {
              e.stopPropagation();

              setVisibleAdharNumber((currentId) =>
                currentId === customer.id ? null : customer.id,
              );
            }}
            aria-label={
              visibleAadharNumber === customer.id
                ? "Hide Aadhaar number"
                : "Show Aadhaar number"
            }
          >
            {visibleAadharNumber === customer.id ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        </div>

        <p className="customer-address">
          <strong>Address:</strong> {customer.address}
        </p>

        {nextEmi && customerLoans[customer.id]?.status === "active" && (
          <div className="customer-next-emi">
            <span>
              Next EMI: <strong>{formatDate(nextEmi.due_date)}</strong>
            </span>

            <span>₹{Number(nextEmi.amount || 0).toLocaleString("en-IN")}</span>
          </div>
        )}

        <div className="customer-actions">
          <button
            type="button"
            className="edit-button"
            onClick={() => setCustomerToEdit(customer)}
          >
            <Pencil size={15} />
            Edit
          </button>

          <button
            type="button"
            className="payment-button"
            onClick={() => handleFinanceButton(customer)}
          >
            <CreditCard size={15} />

            {hasFinance ? "View Finance" : "Add Finance"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <main
      className="dashboard-page"
      onClick={() => setVisibleAdharNumber(null)}
    >
      <header className="dashboard-header">
        <div>
          <h1>{userName}'s Customers</h1>

          <p>
            {customers.length}{" "}
            {customers.length === 1 ? "customer" : "customers"}
          </p>
        </div>

        <div className="profile-wrapper" ref={profileRef}>
          <button
            type="button"
            className="profile-button"
            onClick={(e) => {
              e.stopPropagation();

              setShowProfileMenu((prev) => !prev);
            }}
            aria-label="Open profile menu"
          >
            <UserRound size={22} />
          </button>

          {showProfileMenu && (
            <div className="profile-menu" onClick={(e) => e.stopPropagation()}>
              <p className="profile-email">{session.user.email}</p>

              <button
                type="button"
                onClick={() => {
                  setNewPassword("");
                  setConfirmPassword("");
                  setShowPasswordModal((prev) => !prev);
                }}
              >
                Change Password
              </button>

              {showPasswordModal && (
                <div
                  className="profile-modal-overlay"
                  onClick={() => {
                    setShowPasswordModal(false);
                  }}
                >
                  <div
                    className="profile-modal"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <h3>Change Password</h3>

                    <input
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />

                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />

                    <div className="profile-modal-actions">
                      <button
                        type="button"
                        onClick={() => setShowPasswordModal(false)}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleChangePassword}
                        disabled={updatingPassword}
                      >
                        {updatingPassword ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setNewName(userName);
                  setShowNameModal((prev) => !prev);
                }}
              >
                Change Name
              </button>

              {showNameModal && (
                <div
                  className="profile-modal-overlay"
                  onClick={() => setShowNameModal(false)}
                >
                  <div
                    className="profile-modal"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <h3>Change Name</h3>

                    <input
                      type="text"
                      placeholder="Enter new name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />

                    <div className="profile-modal-actions">
                      <button
                        type="button"
                        onClick={() => setShowNameModal(false)}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleChangeName}
                        disabled={updatingName}
                      >
                        {updatingName ? "Updating..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button type="button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* =========================
          ERROR
      ========================= */}

      {errorMessage && <p className="dashboard-error">{errorMessage}</p>}

      {/* =========================
          CUSTOMER CONTENT
      ========================= */}

      {loadingCustomers ? (
        <p className="loading-customers">Loading customers...</p>
      ) : customers.length === 0 ? (
        <div className="empty-customers">
          <h2>No customers yet</h2>

          <p>Add your first customer to get started.</p>

          <button
            type="button"
            className="empty-add-button"
            onClick={() => setShowAddCustomer(true)}
          >
            + Add Customer
          </button>
        </div>
      ) : (
        <>
          {activeCustomers.length > 0 && (
            <section className="customer-section">
              <div className="customer-section-heading">
                <h2>Active Customers</h2>
                <span>{activeCustomers.length}</span>
              </div>

              <div className="customer-search">
                <input
                  type="search"
                  placeholder="Search active customers..."
                  value={activeSearch}
                  onChange={(event) => setActiveSearch(event.target.value)}
                />
              </div>

              <div className="customers-list">
                {filteredActiveCustomers.map(renderCustomerCard)}
              </div>
            </section>
          )}

          {closedCustomers.length > 0 && (
            <section className="customer-section closed-customer-section">
              <div className="customer-section-heading">
                <h2>Closed Customers</h2>
                <span>{closedCustomers.length}</span>
              </div>

              <div className="customer-search">
                <input
                  type="search"
                  placeholder="Search closed customers..."
                  value={closedSearch}
                  onChange={(event) => setClosedSearch(event.target.value)}
                />
              </div>

              {filteredClosedCustomers.length > 0 ? (
                <div className="customers-list">
                  {filteredClosedCustomers.map(renderCustomerCard)}
                </div>
              ) : (
                <p className="customer-search-empty">
                  No closed customer found.
                </p>
              )}
            </section>
          )}

          {/* FLOATING ADD BUTTON */}

          <button
            type="button"
            className="floating-add-button"
            onClick={() => setShowAddCustomer(true)}
            aria-label="Add customer"
          >
            +
          </button>
        </>
      )}

      <button
        type="button"
        className="theme-toggle-btn"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>

      {/* =========================
          ADD CUSTOMER
      ========================= */}

      {showAddCustomer && (
        <AddCustomer
          userId={session.user.id}
          onCustomerAdded={handleCustomerAdded}
          onClose={() => setShowAddCustomer(false)}
        />
      )}

      {/* =========================
          EDIT CUSTOMER
      ========================= */}

      {customerToEdit && (
        <EditCustomer
          customer={customerToEdit}
          onCustomerUpdated={handleCustomerUpdated}
          onClose={() => setCustomerToEdit(null)}
        />
      )}

      {/* =========================
          ADD FINANCE
      ========================= */}

      {customerFinance && (
        <AddFinance
          customer={customerFinance}
          userId={session.user.id}
          onFinanceAdded={handleFinanceAdded}
          onClose={() => setCustomerFinance(null)}
        />
      )}
    </main>
  );
};

export default Dashboard;
