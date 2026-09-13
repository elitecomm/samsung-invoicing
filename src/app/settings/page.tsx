"use client";

import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Save, Building2, Phone, Mail, MapPin, Hash, Percent, MessageCircle } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings || {}))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  const saveAll = async () => {
    setSaving(true);
    setMessage("");
    try {
      for (const [key, value] of Object.entries(settings)) {
        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
      }
      setMessage("✓ Settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("✗ Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading settings...</div>;
  }

  const sections = [
    {
      title: "Company Information",
      icon: Building2,
      fields: [
        { key: "company_name", label: "Company Name", icon: Building2 },
        { key: "brand_name", label: "Brand Name", icon: Hash },
        { key: "address", label: "Address", icon: MapPin, type: "textarea" },
        { key: "contact", label: "Contact Numbers", icon: Phone },
        { key: "email", label: "Email", icon: Mail },
        { key: "gst_no", label: "GST Number", icon: Hash },
      ],
    },
    {
      title: "Invoice Defaults",
      icon: Hash,
      fields: [
        { key: "tax_rate", label: "Default Tax Rate (%)", icon: Percent, type: "number" },
        { key: "warranty_days", label: "Default Warranty (Days)", icon: Hash, type: "number" },
        { key: "admin_pin", label: "Admin PIN", icon: Hash },
      ],
    },
    {
      title: "WhatsApp Message Template",
      icon: MessageCircle,
      fields: [
        { key: "whatsapp_message_template", label: "Template", icon: MessageCircle, type: "textarea", rows: 12 },
      ],
      description: "Available placeholders: {customer_name}, {company_name}, {invoice_no}, {job_no}, {total}, {paid}, {balance}, {warranty_days}, {warranty_expiry}, {contact}, {mobile}, {device}, {serial}, {problem}, {date}",
    },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon />
            Settings
          </h1>
          <p className="text-gray-600 mt-1">Configure your service center details</p>
        </div>
        <button
          onClick={saveAll}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${message.includes("✓") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-900 border-b pb-2">
                <Icon size={20} />
                {section.title}
              </h2>
              {section.description && (
                <p className="text-xs text-gray-600 mb-3 bg-yellow-50 p-2 rounded">
                  {section.description}
                </p>
              )}
              <div className="space-y-4">
                {section.fields.map((field) => {
                  const FieldIcon = field.icon;
                  return (
                    <div key={field.key}>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <FieldIcon size={14} />
                        {field.label}
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          value={settings[field.key] || ""}
                          onChange={(e) => updateSetting(field.key, e.target.value)}
                          rows={(field as any).rows || 3}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        />
                      ) : (
                        <input
                          type={field.type || "text"}
                          value={settings[field.key] || ""}
                          onChange={(e) => updateSetting(field.key, e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
