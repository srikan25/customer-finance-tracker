import { useState } from "react";
import { supabase } from "../lib/supabase";

import "../styles/addCustomer.css";

const AddCustomer = ({ userId, onCustomerAdded, onClose }) => {
  const [name, setName] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [address, setAddress] = useState("");
  const [createdDate, setCreatedDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim() || !aadhaarNumber || !mobileNumber || !address.trim()) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (!/^\d{12}$/.test(aadhaarNumber)) {
      setErrorMessage("Aadhaar number must contain exactly 12 digits.");
      return;
    }

    if (!/^\d{10}$/.test(mobileNumber)) {
      setErrorMessage("Mobile number must contain exactly 10 digits.");
      return;
    }

    const createdAt = createdDate
      ? new Date(createdDate).toISOString()
      : new Date().toISOString();

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("customers")
        .insert({
          user_id: userId,
          name: name.trim(),
          aadhaar_number: aadhaarNumber,
          mobile_number: mobileNumber,
          address: address.trim(),
          created_at: createdAt,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setName("");
      setAadhaarNumber("");
      setMobileNumber("");
      setAddress("");
      setCreatedDate("");

      onCustomerAdded?.(data);
      onClose?.();
    } catch (error) {
      console.error("Add customer error:", error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="add-customer-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Add Customer</h2>

            <button type="button" className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>
          <form onSubmit={handleAddCustomer}>
            <div>
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label>Aadhaar Number</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={aadhaarNumber}
                onChange={(e) =>
                  setAadhaarNumber(e.target.value.replace(/\D/g, ""))
                }
                placeholder="12-digit Aadhaar number"
              />
            </div>

            <div>
              <label>Mobile Number</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={mobileNumber}
                onChange={(e) =>
                  setMobileNumber(e.target.value.replace(/\D/g, ""))
                }
                placeholder="10-digit mobile number"
              />
            </div>

            <div>
              <label>Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter address"
                rows={3}
              />
            </div>

            <div>
              <label>Created Date & Time</label>
              <input
                type="datetime-local"
                value={createdDate}
                onChange={(e) => setCreatedDate(e.target.value)}
              />
            </div>

            {errorMessage && <p>{errorMessage}</p>}

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="cancel-button"
            >
              Cancel
            </button>

            <button type="submit" disabled={loading} className="save-button">
              {loading ? "Adding..." : "Add Customer"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddCustomer;
