"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/userAuthStore";
import apiClient from "@/lib/apiClient";

export default function SellerProfilePage() {
  const { isLoggedIn } = useAuthStore();

  const [form, setForm] = useState({
    seller_store_name: "",
    seller_contact_no: "",
    seller_whatsapp_contact_no: "",
    seller_website_link: "",
    seller_facebook_page_name: "",
    seller_email: "",
    seller_physical_location: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      setMessage("Please login first");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await apiClient.post(
        "/api/seller/profile/metadata",
        form
      );

      setMessage(res.data.message);
    } catch (err: any) {
      console.error("Seller profile creation failed:", err);

      setMessage(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12 px-4">
      <h1 className="text-2xl font-semibold mb-6">
        Create Seller Profile
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {Object.entries(form).map(([key, val]) => (
          <input
            key={key}
            type="text"
            name={key}
            placeholder={key.replaceAll("_", " ")}
            value={val}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded"
            required={
              key !== "seller_website_link" &&
              key !== "seller_facebook_page_name"
            }
          />
        ))}

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-6 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Create Profile"}
        </button>

        {message && (
          <p className="mt-3 text-sm text-gray-700">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
