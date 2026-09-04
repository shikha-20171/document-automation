"use client";

import { useState } from "react";
import {
  Building2,
  Globe,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  X,
} from "lucide-react";
import axios from "@/lib/axios";
import {
  PasswordField,
  SectionCard,
  StatusOption,
  TextField,
} from "@/app/auth/_components/auth-ui";

type CreateOrganizationDrawerProps = {
  open: boolean;
  onClose: () => void;
};

type FormState = {
  organisation_name: string;
  company_email: string;
  phone_number: string;
  street_address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  website: string;
  full_name: string;
  admin_email: string;
  password: string;
  confirmPassword: string;
  status: "active" | "inactive";
};

const initialState: FormState = {
  organisation_name: "",
  company_email: "",
  phone_number: "",
  street_address: "",
  city: "",
  state: "",
  country: "",
  postal_code: "",
  website: "",
  full_name: "",
  admin_email: "",
  password: "",
  confirmPassword: "",
  status: "active",
};

export default function CreateOrganizationDrawer({
  open,
  onClose,
}: CreateOrganizationDrawerProps) {
  const [formData, setFormData] = useState<FormState>(initialState);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setFormData(initialState);
    setMessage(null);
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Password and confirm password must match.");
      setMessage(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { data: response } = await axios.post<{ success: boolean; message: string }>("/organisations", {
        organisation_name: formData.organisation_name,
        company_email: formData.company_email,
        phone_number: formData.phone_number,
        website: formData.website,
        street_address: formData.street_address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postal_code: formData.postal_code,
        full_name: formData.full_name,
        admin_email: formData.admin_email,
        password: formData.password,
        status: formData.status,
      });

      setMessage(response.message);
      setFormData(initialState);

      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create organization."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={handleClose}
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] transition-opacity ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed right-0 top-0 z-50 h-screen w-full max-w-3xl transform border-l border-slate-200 bg-slate-50 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create Organization</h2>
              <p className="mt-1 text-sm text-slate-600">
                Set up a new organization and its primary admin account.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <SectionCard
                title="Organization details"
                description="Primary information used to identify and contact the organization."
                icon={Building2}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Organization name"
                    placeholder="Northwind Compliance"
                    icon={Building2}
                    name="organisation_name"
                    value={formData.organisation_name}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        organisation_name: event.target.value,
                      }))
                    }
                    required
                    disabled={loading}
                  />
                  <TextField
                    label="Organization email"
                    placeholder="ops@northwind.com"
                    icon={Mail}
                    type="email"
                    name="company_email"
                    value={formData.company_email}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        company_email: event.target.value,
                      }))
                    }
                    autoComplete="email"
                    required
                    disabled={loading}
                  />
                  <TextField
                    label="Phone number"
                    placeholder="+1 (555) 123-9876"
                    icon={Phone}
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        phone_number: event.target.value,
                      }))
                    }
                    required
                    disabled={loading}
                  />
                  <TextField
                    label="Street address"
                    placeholder="245 Harbor Avenue"
                    icon={MapPin}
                    name="street_address"
                    value={formData.street_address}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        street_address: event.target.value,
                      }))
                    }
                    required
                    disabled={loading}
                  />
                  <TextField
                    label="City"
                    placeholder="Seattle"
                    icon={MapPin}
                    name="city"
                    value={formData.city}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                    required
                    disabled={loading}
                  />
                  <TextField
                    label="State"
                    placeholder="Washington"
                    icon={MapPin}
                    name="state"
                    value={formData.state}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        state: event.target.value,
                      }))
                    }
                    required
                    disabled={loading}
                  />
                  <TextField
                    label="Country"
                    placeholder="United States"
                    icon={Globe}
                    name="country"
                    value={formData.country}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        country: event.target.value,
                      }))
                    }
                    required
                    disabled={loading}
                  />
                  <TextField
                    label="Postal code"
                    placeholder="98104"
                    icon={MapPin}
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        postal_code: event.target.value,
                      }))
                    }
                    required
                    disabled={loading}
                  />
                  <div className="sm:col-span-2">
                    <TextField
                      label="Organization website"
                      placeholder="https://northwind.com"
                      icon={Globe}
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          website: event.target.value,
                        }))
                      }
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Organization admin"
                description="Create the first admin who will manage settings, users, and workflows."
                icon={User}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Admin full name"
                    placeholder="Jordan Lee"
                    icon={User}
                    name="full_name"
                    value={formData.full_name}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        full_name: event.target.value,
                      }))
                    }
                    required
                    disabled={loading}
                  />
                  <TextField
                    label="Admin email"
                    placeholder="jordan@northwind.com"
                    icon={Mail}
                    type="email"
                    name="admin_email"
                    value={formData.admin_email}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        admin_email: event.target.value,
                      }))
                    }
                    autoComplete="email"
                    required
                    disabled={loading}
                  />
                  <PasswordField
                    label="Password"
                    placeholder="Create a strong password"
                    name="password"
                    value={formData.password}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    autoComplete="new-password"
                    required
                    disabled={loading}
                  />
                  <PasswordField
                    label="Confirm password"
                    placeholder="Repeat the password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    autoComplete="new-password"
                    required
                    disabled={loading}
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Workspace status"
                description="Choose whether this organization can sign in immediately after creation."
                icon={Lock}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <StatusOption
                    title="Active"
                    description="The organization can access the platform as soon as setup is complete."
                    value="active"
                    checked={formData.status === "active"}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        status: event.target.value as "active" | "inactive",
                      }))
                    }
                    disabled={loading}
                  />
                  <StatusOption
                    title="Inactive"
                    description="Keep access disabled until internal review or onboarding is finished."
                    value="inactive"
                    checked={formData.status === "inactive"}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        status: event.target.value as "active" | "inactive",
                      }))
                    }
                    disabled={loading}
                  />
                </div>
              </SectionCard>

              {message ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  {message}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-12 rounded-2xl border border-slate-200 px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 rounded-2xl bg-[#274690] px-6 text-sm font-semibold text-white transition hover:bg-[#1f3561] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Creating..." : "Create organization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
