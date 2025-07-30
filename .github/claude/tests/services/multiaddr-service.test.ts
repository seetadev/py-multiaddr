import { MultiaddrService } from '../../src/services/multiaddr-service';
import { Multiaddr } from '../../src/lib/multiaddr';

// Mock the multiaddr module
jest.mock('../../src/lib/multiaddr');

describe('MultiaddrService', () => {
  let service: MultiaddrService;
  const MockedMultiaddr = Multiaddr as jest.MockedClass<typeof Multiaddr>;

  beforeEach(() => {
    service = new MultiaddrService();
    jest.clearAllMocks();
  });

  describe('validateAddress', () => {
    it('should return true for valid addresses', async () => {
      MockedMultiaddr.mockImplementation(() => ({
        toString: () => '/ip4/192.168.1.1/tcp/8080'
      } as any));

      const result = await service.validateAddress('/ip4/192.168.1.1/tcp/8080');
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
      expect(MockedMultiaddr).toHaveBeenCalledWith('/ip4/192.168.1.1/tcp/8080');
    });

    it('should return false for invalid addresses', async () => {
      MockedMultiaddr.mockImplementation(() => {
        throw new Error('Invalid address format');
      });

      const result = await service.validateAddress('invalid-address');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid address format');
    });

    it('should handle empty addresses', async () => {
      const result = await service.validateAddress('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Address cannot be empty');
    });

    it('should handle null addresses', async () => {
      const result = await service.validateAddress(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Address cannot be empty');
    });
  });

  describe('parseAddress', () => {
    it('should parse valid multiaddr and extract components', async () => {
      const mockMultiaddr = {
        toString: () => '/ip4/192.168.1.1/tcp/8080',
        protocols: () => [
          { name: 'ip4', code: 4 },
          { name: 'tcp', code: 6 }
        ],
        nodeAddress: () => ({
          family: 'IPv4',
          address: '192.168.1.1',
          port: 8080
        })
      };
      
      MockedMultiaddr.mockImplementation(() => mockMultiaddr as any);

      const result = await service.parseAddress('/ip4/192.168.1.1/tcp/8080');
      
      expect(result).toEqual({
        original: '/ip4/192.168.1.1/tcp/8080',
        protocols: ['ip4', 'tcp'],
        host: '192.168.1.1',
        port: 8080,
        family: 'IPv4'
      });
    });

    it('should handle IPv6 addresses', async () => {
      const mockMultiaddr = {
        toString: () => '/ip6/::1/tcp/8080',
        protocols: () => [
          { name: 'ip6', code: 41 },
          { name: 'tcp', code: 6 }
        ],
        nodeAddress: () => ({
          family: 'IPv6',
          address: '::1',
          port: 8080
        })
      };
      
      MockedMultiaddr.mockImplementation(() => mockMultiaddr as any);

      const result = await service.parseAddress('/ip6/::1/tcp/8080');
      
      expect(result.family).toBe('IPv6');
      expect(result.host).toBe('::1');
    });

    it('should handle domain-based addresses', async () => {
      const mockMultiaddr = {
        toString: () => '/dns4/example.com/tcp/80',
        protocols: () => [
          { name: 'dns4', code: 54 },
          { name: 'tcp', code: 6 }
        ],
        nodeAddress: () => {
          throw new Error('Cannot get node address for DNS');
        }
      };
      
      MockedMultiaddr.mockImplementation(() => mockMultiaddr as any);

      const result = await service.parseAddress('/dns4/example.com/tcp/80');
      
      expect(result.protocols).toContain('dns4');
      expect(result.host).toBe('example.com');
    });
  });

  describe('suggestAddresses', () => {
    it('should return government standard addresses', async () => {
      const suggestions = await service.suggestAddresses('government');
      
      expect(suggestions).toEqual([
        '/dns4/billing.government.gov/tcp/443/https',
        '/dns4/services.government.gov/tcp/443/https',
        '/dns4/notifications.government.gov/tcp/443/https',
        '/ip4/10.0.0.1/tcp/8080',
        '/ip6/::1/tcp/8080'
      ]);
    });

    it('should return local development addresses', async () => {
      const suggestions = await service.suggestAddresses('local');
      
      expect(suggestions).toEqual([
        '/ip4/127.0.0.1/tcp/8080',
        '/ip4/127.0.0.1/tcp/3000',
        '/ip4/localhost/tcp/8000',
        '/ip6/::1/tcp/8080',
        '/unix/tmp/invoice-service.sock'
      ]);
    });

    it('should return empty array for unknown category', async () => {
      const suggestions = await service.suggestAddresses('unknown');
      
      expect(suggestions).toEqual([]);
    });
  });

  describe('formatAddress', () => {
    it('should format address for display', async () => {
      const mockMultiaddr = {
        toString: () => '/ip4/192.168.1.1/tcp/8080',
        protocols: () => [
          { name: 'ip4', code: 4 },
          { name: 'tcp', code: 6 }
        ]
      };
      
      MockedMultiaddr.mockImplementation(() => mockMultiaddr as any);

      const result = await service.formatAddress('/ip4/192.168.1.1/tcp/8080');
      
      expect(result).toEqual({
        formatted: '192.168.1.1:8080',
        protocol: 'TCP/IPv4',
        description: 'TCP connection over IPv4'
      });
    });

    it('should format HTTPS addresses', async () => {
      const mockMultiaddr = {
        toString: () => '/dns4/api.gov/tcp/443/https',
        protocols: () => [
          { name: 'dns4', code: 54 },
          { name: 'tcp', code: 6 },
          { name: 'https', code: 443 }
        ]
      };
      
      MockedMultiaddr.mockImplementation(() => mockMultiaddr as any);

      const result = await service.formatAddress('/dns4/api.gov/tcp/443/https');
      
      expect(result).toEqual({
        formatted: 'https://api.gov',
        protocol: 'HTTPS/DNS',
        description: 'Secure HTTP connection over DNS'
      });
    });
  });

  describe('resolveAddress', () => {
    it('should resolve DNS addresses to IP', async () => {
      // Mock DNS resolution
      service.resolveDNS = jest.fn().mockResolvedValue('192.168.1.100');
      
      const result = await service.resolveAddress('/dns4/example.com/tcp/80');
      
      expect(result).toBe('/ip4/192.168.1.100/tcp/80');
      expect(service.resolveDNS).toHaveBeenCalledWith('example.com');
    });

    it('should return original address if already IP-based', async () => {
      const address = '/ip4/192.168.1.1/tcp/8080';
      const result = await service.resolveAddress(address);
      
      expect(result).toBe(address);
    });

    it('should handle DNS resolution failures', async () => {
      service.resolveDNS = jest.fn().mockRejectedValue(new Error('DNS resolution failed'));
      
      await expect(service.resolveAddress('/dns4/invalid.com/tcp/80'))
        .rejects.toThrow('DNS resolution failed');
    });
  });

  describe('compareAddresses', () => {
    it('should return true for identical addresses', async () => {
      const addr1 = '/ip4/192.168.1.1/tcp/8080';
      const addr2 = '/ip4/192.168.1.1/tcp/8080';
      
      const result = await service.compareAddresses(addr1, addr2);
      
      expect(result).toBe(true);
    });

    it('should return false for different addresses', async () => {
      const addr1 = '/ip4/192.168.1.1/tcp/8080';
      const addr2 = '/ip4/192.168.1.2/tcp/8080';
      
      const result = await service.compareAddresses(addr1, addr2);
      
      expect(result).toBe(false);
    });

    it('should normalize addresses before comparison', async () => {
      service.normalizeAddress = jest.fn()
        .mockReturnValueOnce('/ip4/192.168.1.1/tcp/8080')
        .mockReturnValueOnce('/ip4/192.168.1.1/tcp/8080');
      
      const result = await service.compareAddresses(
        '/ip4/192.168.01.01/tcp/8080',
        '/ip4/192.168.1.1/tcp/08080'
      );
      
      expect(result).toBe(true);
    });
  });
});