'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settings-store';
import { ModernCard } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Settings,
  Save,
  RotateCcw,
  Percent,
  Building,
  Briefcase,
  Plane,
  Bell,
  Cog,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calendar,
  Shield,
  Mail
} from 'lucide-react';

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  expanded: boolean;
}

export default function AdminSettingsPage() {
  const { settings, updateSettings, resetToDefaults, isValidCommissionRate } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [sections, setSections] = useState<SettingsSection[]>([
    { id: 'commission', title: 'Commission Settings', icon: Percent, description: 'Configure commission rates and rules', expanded: true },
    { id: 'company', title: 'Company Information', icon: Building, description: 'Business details and contact information', expanded: false },
    { id: 'business', title: 'Business Rules', icon: Briefcase, description: 'Payment terms and operational settings', expanded: false },
    { id: 'travel', title: 'Travel Operations', icon: Plane, description: 'Travel-specific settings and requirements', expanded: false },
    { id: 'notifications', title: 'Notifications', icon: Bell, description: 'Email, SMS and communication preferences', expanded: false },
    { id: 'system', title: 'System Settings', icon: Cog, description: 'System preferences and maintenance', expanded: false },
  ]);

  useEffect(() => {
    console.log('[SettingsPage] Component mounted');
    return () => {
      console.log('[SettingsPage] Component unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('[SettingsPage] Settings state:', {
      hasChanges,
      saveSuccess,
      expandedSections: sections.filter(s => s.expanded).map(s => s.id)
    });
  }, [hasChanges, saveSuccess, sections]);

  const handleInputChange = (key: keyof typeof settings, value: string | number | boolean) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(settings));
  };

  const toggleSection = (sectionId: string) => {
    console.log('[SettingsPage] Toggling section:', sectionId);
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, expanded: !section.expanded }
        : section
    ));
  };

  const handleSave = () => {
    console.log('[SettingsPage] Saving settings');
    // Validate commission rates
    const commissionRates = [
      localSettings.defaultCommissionRate,
      localSettings.flightCommissionRate,
      localSettings.hotelCommissionRate,
      localSettings.activityCommissionRate,
      localSettings.transferCommissionRate
    ];

    for (const rate of commissionRates) {
      if (!isValidCommissionRate(rate)) {
        console.error('[SettingsPage] Invalid commission rate:', rate);
        alert(`All commission rates must be between ${localSettings.minCommissionRate}% and ${localSettings.maxCommissionRate}%`);
        return;
      }
    }

    if (localSettings.minCommissionRate >= localSettings.maxCommissionRate) {
      console.error('[SettingsPage] Invalid commission bounds');
      alert('Minimum commission rate must be less than maximum commission rate');
      return;
    }

    if (localSettings.defaultPaymentTerms <= 0) {
      console.error('[SettingsPage] Invalid payment terms');
      alert('Payment terms must be greater than 0 days');
      return;
    }

    updateSettings(localSettings);
    setHasChanges(false);
    setSaveSuccess(true);
    console.log('[SettingsPage] Settings saved successfully');
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      resetToDefaults();
      setLocalSettings(useSettingsStore.getState().settings);
      setHasChanges(false);
    }
  };

  const renderCommissionSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Global Default Rate (%)
          </label>
          <Input
            type="number"
            min="0"
            max="50"
            step="0.1"
            value={localSettings.defaultCommissionRate}
            onChange={(e) => handleInputChange('defaultCommissionRate', parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fallback rate for all items</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Plane className="w-4 h-4 inline mr-1" />
            Flight Commission (%)
          </label>
          <Input
            type="number"
            min="0"
            max="50"
            step="0.1"
            value={localSettings.flightCommissionRate}
            onChange={(e) => handleInputChange('flightCommissionRate', parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Default rate for flight bookings</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            🏨 Hotel Commission (%)
          </label>
          <Input
            type="number"
            min="0"
            max="50"
            step="0.1"
            value={localSettings.hotelCommissionRate}
            onChange={(e) => handleInputChange('hotelCommissionRate', parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Default rate for hotel bookings</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            🎯 Activity Commission (%)
          </label>
          <Input
            type="number"
            min="0"
            max="50"
            step="0.1"
            value={localSettings.activityCommissionRate}
            onChange={(e) => handleInputChange('activityCommissionRate', parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Default rate for activity bookings</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            🚗 Transfer Commission (%)
          </label>
          <Input
            type="number"
            min="0"
            max="50"
            step="0.1"
            value={localSettings.transferCommissionRate}
            onChange={(e) => handleInputChange('transferCommissionRate', parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Default rate for transfer bookings</p>
        </div>
      </div>

      <div className="border-t dark:border-gray-700 pt-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Commission Bounds</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Minimum Commission Rate (%)
            </label>
            <Input
              type="number"
              min="0"
              max="50"
              step="0.1"
              value={localSettings.minCommissionRate}
              onChange={(e) => handleInputChange('minCommissionRate', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Commission Rate (%)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={localSettings.maxCommissionRate}
              onChange={(e) => handleInputChange('maxCommissionRate', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompanySettings = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
        <Input
          type="text"
          value={localSettings.companyName}
          onChange={(e) => handleInputChange('companyName', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Email</label>
        <Input
          type="email"
          value={localSettings.companyEmail}
          onChange={(e) => handleInputChange('companyEmail', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Phone</label>
        <Input
          type="tel"
          value={localSettings.companyPhone}
          onChange={(e) => handleInputChange('companyPhone', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
        <select
          value={localSettings.currency}
          onChange={(e) => handleInputChange('currency', e.target.value)}
          className="flex h-12 w-full rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 bg-clio-gray-50 dark:bg-clio-gray-900 px-4 py-3 text-sm font-medium text-clio-gray-900 dark:text-gray-100 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clio-blue/20 focus-visible:border-clio-blue dark:focus-visible:border-clio-blue/50 hover:border-clio-gray-300 dark:hover:border-clio-gray-700 shadow-sm"
        >
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
          <option value="CAD">CAD - Canadian Dollar</option>
          <option value="AUD">AUD - Australian Dollar</option>
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Address</label>
        <Textarea
          rows={3}
          value={localSettings.companyAddress}
          onChange={(e) => handleInputChange('companyAddress', e.target.value)}
        />
      </div>
    </div>
  );

  const renderBusinessSettings = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Calendar className="w-4 h-4 inline mr-1" />
          Default Payment Terms (days)
        </label>
        <Input
          type="number"
          min="1"
          max="365"
          value={localSettings.defaultPaymentTerms}
          onChange={(e) => handleInputChange('defaultPaymentTerms', parseInt(e.target.value) || 30)}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Days customers have to pay invoices</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Auto Quote Expiry (days)
        </label>
        <Input
          type="number"
          min="1"
          max="90"
          value={localSettings.autoQuoteExpiry}
          onChange={(e) => handleInputChange('autoQuoteExpiry', parseInt(e.target.value) || 14)}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">How long quotes remain valid</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Shield className="w-4 h-4 inline mr-1" />
          Approval Required Above ($)
        </label>
        <Input
          type="number"
          min="0"
          step="100"
          value={localSettings.requireApprovalAbove}
          onChange={(e) => handleInputChange('requireApprovalAbove', parseFloat(e.target.value) || 0)}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Bookings above this amount need approval</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Maximum Discount (%)
        </label>
        <Input
          type="number"
          min="0"
          max="50"
          step="1"
          value={localSettings.maxDiscountPercent}
          onChange={(e) => handleInputChange('maxDiscountPercent', parseFloat(e.target.value) || 0)}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum discount agents can apply</p>
      </div>
    </div>
  );

  const renderTravelSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Passport Expiry Warning (months)
          </label>
          <Input
            type="number"
            min="1"
            max="24"
            value={localSettings.passportExpiryWarning}
            onChange={(e) => handleInputChange('passportExpiryWarning', parseInt(e.target.value) || 6)}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Warn when passport expires within this time</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Visa Reminder (days before travel)
          </label>
          <Input
            type="number"
            min="1"
            max="180"
            value={localSettings.visaReminderDays}
            onChange={(e) => handleInputChange('visaReminderDays', parseInt(e.target.value) || 30)}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Days before travel to remind about visa</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Default Requirements</h4>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.defaultTravelInsurance}
              onChange={(e) => handleInputChange('defaultTravelInsurance', e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Default Travel Insurance Required</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.emergencyContactRequired}
              onChange={(e) => handleInputChange('emergencyContactRequired', e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Emergency Contact Required</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Communication Preferences</h4>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.emailNotifications}
              onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Notifications
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.smsNotifications}
              onChange={(e) => handleInputChange('smsNotifications', e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">SMS Notifications</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.customerAutoEmails}
              onChange={(e) => handleInputChange('customerAutoEmails', e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Automatic Customer Emails</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.agentDailyDigest}
              onChange={(e) => handleInputChange('agentDailyDigest', e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Agent Daily Digest</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
        <select
          value={localSettings.timezone}
          onChange={(e) => handleInputChange('timezone', e.target.value)}
          className="flex h-12 w-full rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 bg-clio-gray-50 dark:bg-clio-gray-900 px-4 py-3 text-sm font-medium text-clio-gray-900 dark:text-gray-100 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clio-blue/20 focus-visible:border-clio-blue dark:focus-visible:border-clio-blue/50 hover:border-clio-gray-300 dark:hover:border-clio-gray-700 shadow-sm"
        >
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="UTC">UTC</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Format</label>
        <select
          value={localSettings.dateFormat}
          onChange={(e) => handleInputChange('dateFormat', e.target.value)}
          className="flex h-12 w-full rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 bg-clio-gray-50 dark:bg-clio-gray-900 px-4 py-3 text-sm font-medium text-clio-gray-900 dark:text-gray-100 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clio-blue/20 focus-visible:border-clio-blue dark:focus-visible:border-clio-blue/50 hover:border-clio-gray-300 dark:hover:border-clio-gray-700 shadow-sm"
        >
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Backup Frequency</label>
        <select
          value={localSettings.backupFrequency}
          onChange={(e) => handleInputChange('backupFrequency', e.target.value as 'daily' | 'weekly' | 'monthly')}
          className="flex h-12 w-full rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 bg-clio-gray-50 dark:bg-clio-gray-900 px-4 py-3 text-sm font-medium text-clio-gray-900 dark:text-gray-100 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clio-blue/20 focus-visible:border-clio-blue dark:focus-visible:border-clio-blue/50 hover:border-clio-gray-300 dark:hover:border-clio-gray-700 shadow-sm"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Retention (months)</label>
        <Input
          type="number"
          min="6"
          max="120"
          value={localSettings.dataRetentionMonths}
          onChange={(e) => handleInputChange('dataRetentionMonths', parseInt(e.target.value) || 24)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audit Log Level</label>
        <select
          value={localSettings.auditLogLevel}
          onChange={(e) => handleInputChange('auditLogLevel', e.target.value as 'basic' | 'detailed' | 'verbose')}
          className="flex h-12 w-full rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 bg-clio-gray-50 dark:bg-clio-gray-900 px-4 py-3 text-sm font-medium text-clio-gray-900 dark:text-gray-100 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clio-blue/20 focus-visible:border-clio-blue dark:focus-visible:border-clio-blue/50 hover:border-clio-gray-300 dark:hover:border-clio-gray-700 shadow-sm"
        >
          <option value="basic">Basic</option>
          <option value="detailed">Detailed</option>
          <option value="verbose">Verbose</option>
        </select>
      </div>
    </div>
  );

  const getSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'commission': return renderCommissionSettings();
      case 'company': return renderCompanySettings();
      case 'business': return renderBusinessSettings();
      case 'travel': return renderTravelSettings();
      case 'notifications': return renderNotificationSettings();
      case 'system': return renderSystemSettings();
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="p-4 bg-clio-blue/10 dark:bg-clio-blue/20 rounded-2xl border border-clio-blue/20 shadow-sm">
          <Settings className="w-8 h-8 text-clio-blue" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">Admin Settings</h1>
          <p className="text-sm text-clio-gray-600 dark:text-clio-gray-400 font-medium mt-1">Configure global application settings and business rules</p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <ModernCard key={section.id} className="overflow-hidden border-clio-gray-200 dark:border-clio-gray-800 p-0">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg transition-colors ${section.expanded ? 'bg-clio-blue/10 text-clio-blue' : 'bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-400 group-hover:text-clio-blue'}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-clio-gray-900 dark:text-white uppercase tracking-tight">{section.title}</h3>
                    <p className="text-sm text-clio-gray-500 dark:text-clio-gray-400 font-medium">{section.description}</p>
                  </div>
                </div>
                {section.expanded ? (
                  <ChevronUp className="w-5 h-5 text-clio-blue" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-clio-gray-400 dark:text-clio-gray-600 group-hover:text-clio-blue transition-colors" />
                )}
              </button>

              {section.expanded && (
                <div className="px-8 pb-8 pt-2 border-t border-clio-gray-100 dark:border-clio-gray-800 bg-white dark:bg-clio-gray-900/50">
                  <div className="pt-6">
                    {getSectionContent(section.id)}
                  </div>
                </div>
              )}
            </ModernCard>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between sticky bottom-6 bg-white dark:bg-clio-gray-900 p-4 rounded-xl shadow-strong border border-clio-gray-200 dark:border-clio-gray-800 z-10">
        <ModernButton
          variant="outline"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </ModernButton>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-green-600 dark:text-green-400 font-medium">Settings saved successfully!</span>
          )}
          <ModernButton
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
            {hasChanges && <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-xs">•</span>}
          </ModernButton>
        </div>
      </div>
    </div>
  );
}