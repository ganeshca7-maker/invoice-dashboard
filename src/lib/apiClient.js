const getApiUrl = (path) => {
  const base = process.env.NEXT_PUBLIC_API_URL || '';
  return `${base}${path}`;
};

export class ApiClient {
  static async getInvoices() {
    try {
      const res = await fetch(getApiUrl('/api/invoices'), { cache: 'no-store' });
      return await res.json();
    } catch (err) {
      console.error('Error fetching invoices:', err);
      return [];
    }
  }

  static async saveInvoice(invoice) {
    try {
      const res = await fetch(getApiUrl('/api/invoices'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving invoice:', err);
      return { success: false, error: err.message };
    }
  }

  static async getClients() {
    try {
      const res = await fetch(getApiUrl('/api/clients'), { cache: 'no-store' });
      return await res.json();
    } catch (err) {
      console.error('Error fetching clients:', err);
      return [];
    }
  }

  static async saveClient(client) {
    try {
      const res = await fetch(getApiUrl('/api/clients'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      });
      if (!res.ok) {
        const data = await res.json();
        return { success: false, error: data.error };
      }
      return await res.json();
    } catch (err) {
      console.error('Error saving client:', err);
      return { success: false, error: err.message };
    }
  }

  static async updateClient(client) {
    try {
      const res = await fetch(getApiUrl(`/api/clients/${client._id || client.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      });
      if (!res.ok) {
        const data = await res.json();
        return { success: false, error: data.error };
      }
      return await res.json();
    } catch (err) {
      console.error('Error updating client:', err);
      return { success: false, error: err.message };
    }
  }

  static async getCompanyProfile() {
    try {
      const res = await fetch(getApiUrl('/api/company_profile'), { cache: 'no-store' });
      return await res.json();
    } catch (err) {
      console.error('Error fetching company profile:', err);
      return null;
    }
  }

  static async saveCompanyProfile(profile) {
    try {
      const res = await fetch(getApiUrl('/api/company_profile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving company profile:', err);
      return { success: false, error: err.message };
    }
  }

  static async getCountries() {
    try {
      const res = await fetch(getApiUrl('/api/master_countries'), { cache: 'no-store' });
      return await res.json();
    } catch (err) {
      console.error('Error fetching master countries:', err);
      return [];
    }
  }

  static async saveCountry(country) {
    try {
      const res = await fetch(getApiUrl('/api/master_countries'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country })
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving country:', err);
      return { success: false, error: err.message };
    }
  }

  static async getMasterItems() {
    try {
      const res = await fetch(getApiUrl('/api/master_items'), { cache: 'no-store' });
      return await res.json();
    } catch (err) {
      console.error('Error fetching master items:', err);
      return [];
    }
  }

  static async saveMasterItem(item) {
    try {
      const res = await fetch(getApiUrl('/api/master_items'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving master item:', err);
      return { success: false, error: err.message };
    }
  }

  static async getInvoiceSettings() {
    try {
      const res = await fetch(getApiUrl('/api/invoice_settings'), { cache: 'no-store' });
      return await res.json();
    } catch (err) {
      console.error('Error fetching invoice settings:', err);
      return null;
    }
  }

  static async saveInvoiceSettings(settings) {
    try {
      const res = await fetch(getApiUrl('/api/invoice_settings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      return await res.json();
    } catch (err) {
      console.error('Error saving invoice settings:', err);
      return { success: false, error: err.message };
    }
  }
}
