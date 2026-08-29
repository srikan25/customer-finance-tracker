import { useState } from "react";
import { X } from "lucide-react";

import { supabase } from "../lib/supabase";

import "../styles/editCustomer.css";

const EditCustomer = ({ customer, onCustomerUpdated, onClose }) => {
  const [name, setName] = useState(customer.name);
  const [aadhaarNumber, setAadhaarNumber] = useState(customer.aadhaar_number);
  const [mobileNumber, setMobileNumber] = useState(customer.mobile_number);
  const [address, setAddress] = useState(customer.address);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    if (!name.trim() || !aadhaarNumber || !mobileNumber || !address.trim()) {
      setErrorMessage("Please fill in all fields.");
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

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("customers")
        .update({
          name: name.trim(),
          aadhaar_number: aadhaarNumber,
          mobile_number: mobileNumber,
          address: address.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", customer.id)
        .select()
        .single();

      if (error) throw error;

      onCustomerUpdated(data);
      onClose();
    } catch (error) {
      console.error("Update customer error:", error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-customer-overlay" onClick={onClose}>
      <div className="edit-customer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-customer-header">
          <div>
            <span className="edit-customer-label">Edit Customer</span>
          </div>

          <button
            type="button"
            className="edit-customer-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleUpdateCustomer}>
          {errorMessage && (
            <p className="edit-customer-error">{errorMessage}</p>
          )}

          <div className="edit-form-group">
            <label htmlFor="edit-name">Customer Name</label>

            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>

          <div className="edit-form-group">
            <label htmlFor="edit-mobile">Mobile Number</label>

            <input
              id="edit-mobile"
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={mobileNumber}
              onChange={(e) =>
                setMobileNumber(e.target.value.replace(/\D/g, ""))
              }
              placeholder="Enter 10-digit mobile number"
            />
          </div>

          <div className="edit-form-group">
            <label htmlFor="edit-aadhaar">Aadhaar Number</label>

            <input
              id="edit-aadhaar"
              type="text"
              inputMode="numeric"
              maxLength={12}
              value={aadhaarNumber}
              onChange={(e) =>
                setAadhaarNumber(e.target.value.replace(/\D/g, ""))
              }
              placeholder="Enter 12-digit Aadhaar number"
            />
          </div>

          <div className="edit-form-group">
            <label htmlFor="edit-address">Address</label>

            <textarea
              id="edit-address"
              rows="3"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address"
            />
          </div>

          <div className="edit-customer-actions">
            <button
              type="button"
              className="edit-cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="edit-save-button"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCustomer;
