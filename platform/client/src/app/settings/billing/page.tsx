"use client";

import { useState, useEffect } from "react";
import { getToken } from "@/utils/auth";
import { CreditCard, Zap, CheckCircle2, AlertTriangle } from "lucide-react";

export default function BillingPage() {
    const [billingData, setBillingData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);
    const [error, setError] = useState("");

    const fetchBillingInfo = async () => {
        try {
            const token = getToken();
            const res = await fetch("http://localhost:8000/billing/plan", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBillingData(data);
            } else {
                setError("Failed to load billing information.");
            }
        } catch (err) {
            setError("Network error fetching billing data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBillingInfo();
    }, []);

    const handleUpgrade = async (planId: string) => {
        setUpgrading(true);
        try {
            const token = getToken();
            const res = await fetch("http://localhost:8000/billing/upgrade", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ plan_id: planId })
            });

            if (res.ok) {
                // Refresh billing info to show the new plan layout instantly
                await fetchBillingInfo();
                alert("Success! 100% Discount MVP upgrade applied.");
            } else {
                const data = await res.json();
                alert(data.detail || "Upgrade failed");
            }
        } catch (e) {
            alert("Network error during upgrade");
        } finally {
            setUpgrading(false);
        }
    };

    if (loading) return <div className="p-8">Loading billing info...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;

    const { plan_details, usage } = billingData;
    const emailsPct = Math.min(100, Math.round((usage.emails_sent_this_cycle / plan_details.max_monthly_emails) * 100));
    const contactsPct = Math.min(100, Math.round((usage.contacts_used / plan_details.max_contacts) * 100));

    // Use the static UUIDs from our SQL migration
    const FREE_PLAN_ID = "11111111-1111-1111-1111-111111111111";
    const PRO_PLAN_ID = "33333333-3333-3333-3333-333333333333";

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Plan & Usage</h1>
                <p className="text-gray-500 mt-1">Manage your subscription and monitor monthly limits.</p>
            </div>

            {/* Current Plan Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-start justify-between">
                <div>
                    <div className="flex items-center space-x-2">
                        <h2 className="text-xl font-bold text-gray-900">{plan_details.name} Plan</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            Active
                        </span>
                    </div>
                    <p className="text-gray-500 mt-2 text-sm">
                        ${plan_details.price_monthly} / month. Next cycle resets exactly 30 days from signups.
                    </p>
                </div>
                {plan_details.name !== "Pro" && (
                    <button
                        onClick={() => handleUpgrade(PRO_PLAN_ID)}
                        disabled={upgrading}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-sm transition-all text-sm font-medium"
                    >
                        <Zap className="h-4 w-4" />
                        <span>{upgrading ? "Upgrading..." : "Upgrade to Pro"}</span>
                    </button>
                )}
            </div>

            {/* Usage Progress Bars */}
            <h3 className="text-lg font-bold text-gray-900 mt-8 mb-4">Current Cycle Usage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Emails Used */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Emails Sent</p>
                            <h4 className="text-2xl font-bold text-gray-900 mt-1">
                                {usage.emails_sent_this_cycle.toLocaleString()} <span className="text-base font-normal text-gray-400">/ {plan_details.max_monthly_emails.toLocaleString()}</span>
                            </h4>
                        </div>
                        {emailsPct >= 80 && <AlertTriangle className="h-5 w-5 text-amber-500 mb-2" />}
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2 overflow-hidden">
                        <div
                            className={`h-2.5 rounded-full ${emailsPct >= 100 ? 'bg-red-500' : emailsPct >= 80 ? 'bg-amber-500' : 'bg-blue-600'}`}
                            style={{ width: `${emailsPct}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-500">{emailsPct}% of monthly quota used</p>
                </div>

                {/* Contacts Stored */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Contacts</p>
                            <h4 className="text-2xl font-bold text-gray-900 mt-1">
                                {usage.contacts_used.toLocaleString()} <span className="text-base font-normal text-gray-400">/ {plan_details.max_contacts.toLocaleString()}</span>
                            </h4>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2 overflow-hidden">
                        <div
                            className={`h-2.5 rounded-full ${contactsPct >= 100 ? 'bg-red-500' : 'bg-indigo-600'}`}
                            style={{ width: `${contactsPct}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-500">{contactsPct}% of plan limit used</p>
                </div>
            </div>

            {/* Features Comparison */}
            <h3 className="text-lg font-bold text-gray-900 mt-10 mb-4">Available Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Plan */}
                <div className={`rounded-xl border p-6 flex flex-col ${plan_details.name === "Free" ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 bg-white'}`}>
                    <h3 className="text-lg font-bold text-gray-900">Starter Free</h3>
                    <p className="text-3xl font-extrabold text-gray-900 mt-2">$0 <span className="text-sm font-medium text-gray-500">/mo</span></p>
                    <p className="text-sm text-gray-500 mt-3 mb-6">Perfect for bootstrapping your audience.</p>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex items-center text-sm text-gray-600"><CheckCircle2 className="h-4 w-4 text-gray-400 mr-2" /> Up to 500 Contacts</li>
                        <li className="flex items-center text-sm text-gray-600"><CheckCircle2 className="h-4 w-4 text-gray-400 mr-2" /> 1,000 Emails / Month</li>
                        <li className="flex items-center text-sm text-gray-600"><CheckCircle2 className="h-4 w-4 text-gray-400 mr-2" /> Shared IPs</li>
                    </ul>
                    {plan_details.name === "Free" ? (
                        <button disabled className="w-full py-2 bg-gray-100 text-gray-500 rounded-lg font-medium text-sm">Current Plan</button>
                    ) : (
                        <button onClick={() => handleUpgrade(FREE_PLAN_ID)} className="w-full py-2 border border-gray-300 rounded-lg font-medium text-sm hover:bg-gray-50">Downgrade</button>
                    )}
                </div>

                {/* Pro Plan */}
                <div className={`rounded-xl border p-6 flex flex-col relative ${plan_details.name === "Pro" ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50/10' : 'border-gray-200 bg-white'}`}>
                    {plan_details.name !== "Pro" && (
                        <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] uppercase font-bold tracking-wider py-1 px-3 rounded-full shadow-sm">Recommended</span>
                        </div>
                    )}
                    <h3 className="text-lg font-bold text-gray-900">Professional</h3>
                    <p className="text-3xl font-extrabold text-gray-900 mt-2">$99 <span className="text-sm font-medium text-gray-500">/mo</span></p>
                    <p className="text-sm text-gray-500 mt-3 mb-6">For scaling businesses that need serious deliverability.</p>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex items-center text-sm text-gray-900 font-medium"><CheckCircle2 className="h-4 w-4 text-blue-600 mr-2" /> Up to 50,000 Contacts</li>
                        <li className="flex items-center text-sm text-gray-900 font-medium"><CheckCircle2 className="h-4 w-4 text-blue-600 mr-2" /> 100,000 Emails / Month</li>
                        <li className="flex items-center text-sm text-gray-900 font-medium"><CheckCircle2 className="h-4 w-4 text-blue-600 mr-2" /> Custom Send Domains (DKIM)</li>
                    </ul>
                    {plan_details.name === "Pro" ? (
                        <button disabled className="w-full py-2 bg-gray-100 text-gray-500 rounded-lg font-medium text-sm">Current Plan</button>
                    ) : (
                        <button onClick={() => handleUpgrade(PRO_PLAN_ID)} className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 shadow-sm flex justify-center items-center">
                            <CreditCard className="h-4 w-4 mr-2" /> Buy Professional
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
