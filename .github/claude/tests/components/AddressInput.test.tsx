import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import '@testing-library/jest-dom';
import { AddressInput } from '../../src/components/AddressInput';

const renderWithIonic = (component: React.ReactElement) => {
  return render(
    <IonApp>
      {component}
    </IonApp>
  );
};

describe('AddressInput Component', () => {
  const mockOnChange = jest.fn();
  const mockOnValidation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default props', () => {
    renderWithIonic(<AddressInput onChange={mockOnChange} />);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Network Address')).toBeInTheDocument();
  });

  it('should render with custom label', () => {
    renderWithIonic(
      <AddressInput 
        onChange={mockOnChange} 
        label="Billing Server Address" 
      />
    );
    
    expect(screen.getByText('Billing Server Address')).toBeInTheDocument();
  });

  it('should handle valid multiaddr input', async () => {
    renderWithIonic(
      <AddressInput 
        onChange={mockOnChange}
        onValidation={mockOnValidation}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '/ip4/192.168.1.1/tcp/8080' } });
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('/ip4/192.168.1.1/tcp/8080', true);
      expect(mockOnValidation).toHaveBeenCalledWith(true, null);
    });
  });

  it('should handle invalid multiaddr input', async () => {
    renderWithIonic(
      <AddressInput 
        onChange={mockOnChange}
        onValidation={mockOnValidation}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'invalid-address' } });
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('invalid-address', false);
      expect(mockOnValidation).toHaveBeenCalledWith(false, expect.any(String));
    });
    
    expect(screen.getByText(/Invalid address format/)).toBeInTheDocument();
  });

  it('should show validation error message', async () => {
    renderWithIonic(<AddressInput onChange={mockOnChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'not-a-valid-address' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid address format/)).toBeInTheDocument();
    });
  });

  it('should clear validation error when input becomes valid', async () => {
    renderWithIonic(<AddressInput onChange={mockOnChange} />);
    
    const input = screen.getByRole('textbox');
    
    // Enter invalid address
    fireEvent.change(input, { target: { value: 'invalid' } });
    await waitFor(() => {
      expect(screen.getByText(/Invalid address format/)).toBeInTheDocument();
    });
    
    // Enter valid address
    fireEvent.change(input, { target: { value: '/ip4/127.0.0.1/tcp/3000' } });
    await waitFor(() => {
      expect(screen.queryByText(/Invalid address format/)).not.toBeInTheDocument();
    });
  });

  it('should handle predefined address suggestions', async () => {
    const suggestions = [
      '/ip4/10.0.0.1/tcp/8080',
      '/ip4/192.168.1.100/tcp/3000'
    ];
    
    renderWithIonic(
      <AddressInput 
        onChange={mockOnChange}
        suggestions={suggestions}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    
    await waitFor(() => {
      expect(screen.getByText('/ip4/10.0.0.1/tcp/8080')).toBeInTheDocument();
      expect(screen.getByText('/ip4/192.168.1.100/tcp/3000')).toBeInTheDocument();
    });
  });

  it('should select suggestion on click', async () => {
    const suggestions = ['/ip4/10.0.0.1/tcp/8080'];
    
    renderWithIonic(
      <AddressInput 
        onChange={mockOnChange}
        suggestions={suggestions}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    
    await waitFor(() => {
      const suggestion = screen.getByText('/ip4/10.0.0.1/tcp/8080');
      fireEvent.click(suggestion);
    });
    
    expect(mockOnChange).toHaveBeenCalledWith('/ip4/10.0.0.1/tcp/8080', true);
  });

  it('should be disabled when disabled prop is true', () => {
    renderWithIonic(
      <AddressInput 
        onChange={mockOnChange}
        disabled={true}
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should show loading state', () => {
    renderWithIonic(
      <AddressInput 
        onChange={mockOnChange}
        loading={true}
      />
    );
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle copy to clipboard functionality', async () => {
    const mockWriteText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: mockWriteText }
    });
    
    renderWithIonic(
      <AddressInput 
        onChange={mockOnChange}
        value="/ip4/127.0.0.1/tcp/8080"
      />
    );
    
    const copyButton = screen.getByTestId('copy-button');
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('/ip4/127.0.0.1/tcp/8080');
    });
  });
});