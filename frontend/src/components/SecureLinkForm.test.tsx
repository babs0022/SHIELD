import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SecureLinkForm from './SecureLinkForm';
import { useAccount, useWriteContract, usePublicClient, useSwitchChain } from 'wagmi';
import { isAddress } from 'viem';
import { base } from 'wagmi/chains';
import toast from 'react-hot-toast';

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useWriteContract: jest.fn(),
  usePublicClient: jest.fn(),
  useSwitchChain: jest.fn(),
}));

// Mock viem's isAddress
jest.mock('viem', () => ({
  isAddress: jest.fn(),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    loading: jest.fn(),
    success: jest.fn(),
    dismiss: jest.fn(),
  },
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock crypto.getRandomValues for consistent policyId generation
Object.defineProperty(global.crypto, 'getRandomValues', {
  value: <T extends Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array>(array: T) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = i; // Predictable values for testing
    }
    return array;
  },
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

describe('SecureLinkForm', () => {
  const mockUseAccount = useAccount as jest.Mock;
  const mockUseWriteContract = useWriteContract as jest.Mock;
  const mockUsePublicClient = usePublicClient as jest.Mock;
  const mockUseSwitchChain = useSwitchChain as jest.Mock;
  const mockIsAddress = isAddress as jest.Mock;

  const mockWriteContractAsync = jest.fn();
  const mockWaitForTransactionReceipt = jest.fn();
  const mockSwitchChain = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks for a connected user on the correct network
    mockUseAccount.mockReturnValue({
      address: '0xConnectedUserAddress',
      isConnected: true,
      chainId: base.id,
    });
    mockUseWriteContract.mockReturnValue({
      data: '0xmockTxHash',
      writeContractAsync: mockWriteContractAsync,
    });
    mockUsePublicClient.mockReturnValue({
      waitForTransactionReceipt: mockWaitForTransactionReceipt,
      readContract: jest.fn().mockResolvedValue(['0x0000000000000000000000000000000000000000']), // Policy does not exist by default
    });
    mockUseSwitchChain.mockReturnValue({
      switchChain: mockSwitchChain,
    });
    mockIsAddress.mockReturnValue(true); // All addresses are valid by default

    // Mock toast IDs to prevent errors when dismissing
    (toast.loading as jest.Mock).mockReturnValue('loading-toast-id');
  });

  it('renders correctly when not connected', () => {
    mockUseAccount.mockReturnValue({ address: undefined, isConnected: false, chainId: undefined });
    render(<SecureLinkForm />);
    expect(screen.getByText('Sign in to Generate Link')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in to Generate Link/i })).toBeDisabled();
  });

  it('renders correctly when connected but on wrong network', () => {
    mockUseAccount.mockReturnValue({
      address: '0xConnectedUserAddress',
      isConnected: true,
      chainId: 1, // Ethereum Mainnet
    });
    render(<SecureLinkForm />);
    expect(screen.getByText('Switch to Base Network')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Switch to Base Network/i })).not.toBeDisabled();
  });

  it('allows switching network when on wrong network', () => {
    mockUseAccount.mockReturnValue({
      address: '0xConnectedUserAddress',
      isConnected: true,
      chainId: 1,
    });
    render(<SecureLinkForm />);
    fireEvent.click(screen.getByRole('button', { name: /Switch to Base Network/i }));
    expect(mockSwitchChain).toHaveBeenCalledWith({ chainId: base.id });
  });

  it('disables submit button for invalid recipient address', () => {
    mockIsAddress.mockReturnValue(false);
    render(<SecureLinkForm />);

    const recipientInput = screen.getByLabelText(/Recipient Address/i);
    fireEvent.change(recipientInput, { target: { value: 'invalid-address' } });

    expect(screen.getByText('Please enter a valid Ethereum address.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Link/i })).toBeDisabled();
  });

  it('shows error toast if content is missing on submit', async () => {
    render(<SecureLinkForm />);

    // Clear default file/text content
    fireEvent.click(screen.getByRole('button', { name: /Text/i })); // Switch to text mode
    fireEvent.change(screen.getByLabelText(/Confidential Text/i), { target: { value: '' } });

    fireEvent.click(screen.getByRole('button', { name: /Generate Link/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please provide the content you want to share.');
    });
  });

  it('successfully creates a secure link with text content', async () => {
    const mockPolicyId = '0x0101010101010101010101010101010101010101010101010101010101010101';
    const mockContentCid = 'mockCid';
    const mockSecretKey = 'mockSecret';
    const mockMimeType = 'text/plain';
    const mockLink = `https://shieldhq.xyz/r/${mockPolicyId}`;

    // Mock API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contentCid: mockContentCid, secretKey: mockSecretKey, mimeType: mockMimeType }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ link: mockLink }),
      });

    // Mock contract read for policyId uniqueness
    mockUsePublicClient.mockReturnValue({
      waitForTransactionReceipt: mockWaitForTransactionReceipt,
      readContract: jest.fn().mockResolvedValueOnce(['0x0000000000000000000000000000000000000000']), // First check: policy does not exist
    });

    render(<SecureLinkForm />);

    // Input text content
    fireEvent.click(screen.getByRole('button', { name: /Text/i }));
    fireEvent.change(screen.getByLabelText(/Confidential Text/i), { target: { value: 'My secret message' } });

    // Input recipient address
    const recipientInput = screen.getByLabelText(/Recipient Address/i);
    fireEvent.change(recipientInput, { target: { value: '0xRecipientAddress' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Generate Link/i }));

    // Assert loading states and API calls
    await waitFor(() => {
      expect(toast.loading).toHaveBeenCalledWith('Preparing content...', expect.any(Object));
      expect(mockFetch).toHaveBeenCalledWith('/api/prepareContent', expect.any(Object));
      expect(screen.getByText(/Preparing.../i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Confirming.../i)).toBeInTheDocument();
      expect(toast.loading).toHaveBeenCalledWith('Please confirm in your wallet...', expect.any(Object));
      expect(mockWriteContractAsync).toHaveBeenCalledWith(expect.any(Object));
    });

    await waitFor(() => {
      expect(screen.getByText(/Processing.../i)).toBeInTheDocument();
      expect(toast.loading).toHaveBeenCalledWith('Processing transaction...', expect.any(Object));
      expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith({ hash: '0xmockTxHash' });
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/storeMetadata', expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith('Secure link generated successfully!', expect.any(Object));
      expect(screen.getByDisplayValue(mockLink)).toBeInTheDocument();
    });
  });

  it('handles user rejecting wallet signature', async () => {
    mockWriteContractAsync.mockRejectedValueOnce(new Error('User rejected the request'));

    render(<SecureLinkForm />);

    // Fill form to enable submission
    fireEvent.click(screen.getByRole('button', { name: /Text/i }));
    fireEvent.change(screen.getByLabelText(/Confidential Text/i), { target: { value: 'test' } });
    fireEvent.change(screen.getByLabelText(/Recipient Address/i), { target: { value: '0xRecipientAddress' } });

    fireEvent.click(screen.getByRole('button', { name: /Generate Link/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Wallet signature rejected. Please confirm the transaction in your wallet to create the link.', expect.any(Object));
      expect(screen.queryByText(/Processing.../i)).not.toBeInTheDocument();
    });
  });

  it('handles prepareContent API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Content preparation failed' }),
    });

    render(<SecureLinkForm />);

    // Fill form to enable submission
    fireEvent.click(screen.getByRole('button', { name: /Text/i }));
    fireEvent.change(screen.getByLabelText(/Confidential Text/i), { target: { value: 'test' } });
    fireEvent.change(screen.getByLabelText(/Recipient Address/i), { target: { value: '0xRecipientAddress' } });

    fireEvent.click(screen.getByRole('button', { name: /Generate Link/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Content preparation failed', expect.any(Object));
    });
  });

  it('handles storeMetadata API failure', async () => {
    const mockPolicyId = '0x0101010101010101010101010101010101010101010101010101010101010101';
    const mockContentCid = 'mockCid';
    const mockSecretKey = 'mockSecret';
    const mockMimeType = 'text/plain';

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contentCid: mockContentCid, secretKey: mockSecretKey, mimeType: mockMimeType }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Metadata storage failed' }),
      });

    render(<SecureLinkForm />);

    // Fill form to enable submission
    fireEvent.click(screen.getByRole('button', { name: /Text/i }));
    fireEvent.change(screen.getByLabelText(/Confidential Text/i), { target: { value: 'test' } });
    fireEvent.change(screen.getByLabelText(/Recipient Address/i), { target: { value: '0xRecipientAddress' } });

    fireEvent.click(screen.getByRole('button', { name: /Generate Link/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Metadata storage failed', expect.any(Object));
    });
  });

  it('copies the secure link to clipboard', async () => {
    const mockPolicyId = '0x0101010101010101010101010101010101010101010101010101010101010101';
    const mockContentCid = 'mockCid';
    const mockSecretKey = 'mockSecret';
    const mockMimeType = 'text/plain';
    const mockLink = `https://shieldhq.xyz/r/${mockPolicyId}`;

    // Mock successful link creation
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ contentCid: mockContentCid, secretKey: mockSecretKey, mimeType: mockMimeType }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ link: mockLink }),
      });

    render(<SecureLinkForm />);

    // Fill form and submit
    fireEvent.click(screen.getByRole('button', { name: /Text/i }));
    fireEvent.change(screen.getByLabelText(/Confidential Text/i), { target: { value: 'My secret message' } });
    fireEvent.change(screen.getByLabelText(/Recipient Address/i), { target: { value: '0xRecipientAddress' } });
    fireEvent.click(screen.getByRole('button', { name: /Generate Link/i }));

    // Wait for link to be generated and displayed
    await waitFor(() => {
      expect(screen.getByDisplayValue(mockLink)).toBeInTheDocument();
    });

    // Click copy button
    fireEvent.click(screen.getByRole('button', { name: /Copy/i }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockLink);
      expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard!');
    });
  });
});
