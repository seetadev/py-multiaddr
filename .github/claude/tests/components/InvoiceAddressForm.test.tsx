import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import '@testing-library/jest-dom';
import { InvoiceAddressForm } from '../../src/components/InvoiceAddressForm';
import { InvoiceData } from '../../src/types/invoice';

const renderWithIonic = (component: React.ReactElement) => {
  return render(
    <IonApp>
      {component}
    </IonApp>
  );
};

describe('InvoiceAddressForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnValidationChange = jest.fn();

  const defaultInvoiceData: Partial<InvoiceData> = {
    billingAddress: '',
    serviceAddress: '',
    notificationAddress: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all required address fields', () => {
    renderWithIonic(
      <InvoiceAddressForm 
        invoiceData={defaultInvoiceData}
        onSubmit={mockOnSubmit}
      />
    );
    
    expect(screen.getByText('Billing Address')).toBeInTheDocument();
    expect(screen.getByText('Service Address')).toBeInTheDocument();
    expect(screen.getByText('Notification Address')).toBeInTheDocument();
  });

  it('should populate form with existing data', () => {
    const invoiceData = {
      billingAddress: '/ip4/192.168.1.10/tcp/8080',
      serviceAddress: '/ip4/10.0.0.5/tcp/3000',
      notificationAddress: '/dns4/notifications.gov/tcp/443/https'
    };

    renderWithIonic(
      <InvoiceAddressForm 
        invoiceData={invoiceData}
        onSubmit={mockOnSubmit}
      />
    );
    
    const billingInput = screen.getByDisplayValue('/ip4/192.168.1.10/tcp/8080');
    const serviceInput = screen.getByDisplayValue('/ip4/10.0.0.5/tcp/3000');
    const notificationInput = screen.getByDisplayValue('/dns4/notifications.gov/tcp/443/https');
    
    expect(billingInput).toBeInTheDocument();
    expect(serviceInput).toBeInTheDocument();
    expect(notificationInput).toBeInTheDocument();
  });

  it('should validate all addresses before submission', async () => {
    renderWithIonic(
      <InvoiceAddressForm 
        invoiceData={defaultInvoiceData}
        onSubmit={mockOnSubmit}
        onValidationChange={mockOnValidationChange}
      />
    );
    
    const billingInput = screen.getByLabelText('Billing Address');
    const serviceInput = screen.getByLabelText('Service Address');
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    // Fill in valid addresses
    fireEvent.change(billingInput, { 
      target: { value: '/ip4/192.168.1.1/tcp/8080' } 
    });
    fireEvent.change(serviceInput, { 
      target: { value: '/ip4/10.0.0.1/tcp/3000' } 
    });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        billingAddress: '/ip4/192.168.1.1/tcp/8080',
        serviceAddress: '/ip4/10.0.0.1/tcp/3000',
        notificationAddress: ''
      });
    });
  });

  it('should prevent submission with invalid addresses', async () => {
    renderWithIonic(
      <InvoiceAddressForm 
        invoiceData={defaultInvoiceData}
        onSubmit={mockOnSubmit}
      />
    );
    
    const billingInput = screen.getByLabelText('Billing Address');
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    fireEvent.change(billingInput, { 
      target: { value: 'invalid-address' } 
    });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Please correct invalid addresses/)).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('should show validation errors for each field', async () => {
    renderWithIonic(
      <InvoiceAddressForm 
        invoiceData={defaultInvoiceData}
        onSubmit={mockOnSubmit}
      />
    );
    
    const billingInput = screen.getByLabelText('Billing Address');
    const serviceInput = screen.getByLabelText('Service Address');
    
    fireEvent.change(billingInput, { target: { value: 'invalid1' } });
    fireEvent.change(serviceInput, { target: { value: 'invalid2' } });
    
    await waitFor(() => {
      const errorMessages = screen.getAllByText(/Invalid address format/);
      expect(errorMessages).toHaveLength(2);
    });
  });

  it('should handle address template selection', async () => {
    renderWithIonic(
      <InvoiceAddressForm 
        invoiceData={defaultInvoiceData}
        onSubmit={mockOnSubmit}
        showTemplates={true}
      />
    );
    
    const templateSelect = screen.getByLabelText('Address Template');
    fireEvent.change(templateSelect, { 
      target: { value: 'government-standard' } 
    });
    
    await waitFor(() => {
      expect(screen.getByDisplayValue(/\/dns4\/billing\.gov/)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/\/dns4\/services\.gov/)).toBeInTheDocument();
    });
  });

  it('should validate required fields', async () => {
    renderWithIonic(
      <InvoiceAddressForm 
        invoiceData={defaultInvoiceData}
        onSubmit={mockOnSubmit}
        requiredFields={['billingAddress', 'serviceAddress']}
      />
    );
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Billing address is required/)).toBeInTheDocument();
      expect(screen.getByText(/Service address is required/)).toBeInTheDocument();
    });
  });

  it('should auto-populate service address from billing address', async () => {
    renderWithIonic(
      <InvoiceAddressForm 
        invoiceData={defaultInvoiceData}
        onSubmit={mockOnSubmit}
        autoPopulateService={true}
      />
    );
    
    const billingInput = screen.getByLabelText('Billing Address');
    const copyButton = screen.getByTestId('copy-billing-to-service');
    
    fireEvent.change(billingInput, { 
      target: { value: '/ip4/192.168.1.1/tcp/8080' } 
    });
    
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      const serviceInput = screen.getByLabelText('Service Address');
      expect(serviceInput).toHaveValue('/ip4/192.168.1.1/tcp/8080');
    });
  });

  it('should handle form reset', () => {
    const invoiceData = {
      billingAddress: '/ip4/192.168.1.1/tcp/8080',
      serviceAddress: '/ip4/10.0.0.1/tcp/3000',
      notificationAddress: '/dns4/notify.gov/tcp/443'
    };

    renderWithIonic(
      <InvoiceAddressForm 
        invoiceData={invoiceData}
        onSubmit={mockOnSubmit}
      />
    );
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);
    
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach(input => {
      expect(input).toHaveValue('');
    });
  });

  it('should call validation change callback', async () => {
    renderWithIonic(
      <InvoiceAddressForm 
        invoiceData={defaultInvoiceData}
        onSubmit={mockOnSubmit}
        onValidationChange={mockOnValidationChange}
      />
    );
    
    const billingInput = screen.getByLabelText('Billing Address');
    
    fireEvent.change(billingInput, { 
      target: { value: '/ip4/192.168.1.1/tcp/8080' } 
    });
    
    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith({
        isValid: true,
        errors: {},
        fieldValidation: {
          billingAddress: true,
          serviceAddress: true,
          notificationAddress: true
        }
      });
    });
  });
});