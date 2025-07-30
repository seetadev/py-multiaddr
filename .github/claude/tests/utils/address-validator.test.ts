import { 
  isValidMultiaddr,
  isValidIPv4,
  isValidIPv6,
  isValidDomain,
  isValidPort,
  validateAddressComponents,
  sanitizeAddress
} from '../../src/utils/address-validator';

describe('Address Validator Utils', () => {
  describe('isValidMultiaddr', () => {
    it('should validate correct multiaddr formats', () => {
      expect(isValidMultiaddr('/ip4/127.0.0.1/tcp/8080')).toBe(true);
      expect(isValidMultiaddr('/ip6/::1/tcp/3000')).toBe(true);
      expect(isValidMultiaddr('/dns4/example.com/tcp/80/http')).toBe(true);
      expect(isValidMultiaddr('/dns6/example.com/tcp/443/https')).toBe(true);
    });

    it('should reject invalid multiaddr formats', () => {
      expect(isValidMultiaddr('192.168.1.1:8080')).toBe(false);
      expect(isValidMultiaddr('/invalid/protocol')).toBe(false);
      expect(isValidMultiaddr('/ip4/256.256.256.256/tcp/8080')).toBe(false);
      expect(isValidMultiaddr('')).toBe(false);
      expect(isValidMultiaddr(null as any)).toBe(false);
    });

    it('should handle complex multiaddr chains', () => {
      expect(isValidMultiaddr('/ip4/1.2.3.4/tcp/80/http/p2p/QmHash')).toBe(true);
      expect(isValidMultiaddr('/ip6/2001:db8::1/tcp/443/tls/ws')).toBe(true);
    });

    it('should validate unix socket addresses', () => {
      expect(isValidMultiaddr('/unix/tmp/socket')).toBe(true);
      expect(isValidMultiaddr('/unix//var/run/app.sock')).toBe(true);
    });

    it('should validate onion addresses', () => {
      expect(isValidMultiaddr('/onion/aaimaq4ygg2iegci:80')).toBe(true);
      expect(isValidMultiaddr('/onion3/vww6ybal4bd7szmgncyruucpgfkqahzddi37ktceo3ah7ngmcopnpyyd:1234')).toBe(true);
    });
  });

  describe('isValidIPv4', () => {
    it('should validate correct IPv4 addresses', () => {
      expect(isValidIPv4('127.0.0.1')).toBe(true);
      expect(isValidIPv4('192.168.1.1')).toBe(true);
      expect(isValidIPv4('0.0.0.0')).toBe(true);
      expect(isValidIPv4('255.255.255.255')).toBe(true);
      expect(isValidIPv4('10.0.0.1')).toBe(true);
    });

    it('should reject invalid IPv4 addresses', () => {
      expect(isValidIPv4('256.1.1.1')).toBe(false);
      expect(isValidIPv4('192.168.1')).toBe(false);
      expect(isValidIPv4('192.168.1.1.1')).toBe(false);
      expect(isValidIPv4('192.168.1.256')).toBe(false);
      expect(isValidIPv4('abc.def.ghi.jkl')).toBe(false);
      expect(isValidIPv4('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidIPv4('01.01.01.01')).toBe(false); // Leading zeros
      expect(isValidIPv4('1.1.1.1.')).toBe(false); // Trailing dot
      expect(isValidIPv4('.1.1.1.1')).toBe(false); // Leading dot
    });
  });

  describe('isValidIPv6', () => {
    it('should validate correct IPv6 addresses', () => {
      expect(isValidIPv6('::1')).toBe(true);
      expect(isValidIPv6('::')).toBe(true);
      expect(isValidIPv6('2001:db8::1')).toBe(true);
      expect(isValidIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
      expect(isValidIPv6('fe80::1%lo0')).toBe(true);
    });

    it('should reject invalid IPv6 addresses', () => {
      expect(isValidIPv6('192.168.1.1')).toBe(false);
      expect(isValidIPv6('2001:db8::1::')).toBe(false); // Double ::
      expect(isValidIPv6('gggg::1')).toBe(false); // Invalid hex
      expect(isValidIPv6('')).toBe(false);
    });

    it('should handle IPv4-mapped IPv6 addresses', () => {
      expect(isValidIPv6('::ffff:192.168.1.1')).toBe(true);
      expect(isValidIPv6('2001:db8::192.168.1.1')).toBe(true);
    });
  });

  describe('isValidDomain', () => {
    it('should validate correct domain names', () => {
      expect(isValidDomain('example.com')).toBe(true);
      expect(isValidDomain('api.billing.government.gov')).toBe(true);
      expect(isValidDomain('localhost')).toBe(true);
      expect(isValidDomain('test-server.internal')).toBe(true);
      expect(isValidDomain('xn--n3h.com')).toBe(true); // IDN
    });

    it('should reject invalid domain names', () => {
      expect(isValidDomain('')).toBe(false);
      expect(isValidDomain('.example.com')).toBe(false);
      expect(isValidDomain('example.com.')).toBe(false);
      expect(isValidDomain('example..com')).toBe(false);
      expect(isValidDomain('-example.com')).toBe(false);
      expect(isValidDomain('example-.com')).toBe(false);
    });

    it('should handle maximum length validation', () => {
      const longDomain = 'a'.repeat(250) + '.com';
      expect(isValidDomain(longDomain)).toBe(false);
      
      const validLengthDomain = 'a'.repeat(50) + '.com';
      expect(isValidDomain(validLengthDomain)).toBe(true);
    });
  });

  describe('isValidPort', () => {
    it('should validate correct port numbers', () => {
      expect(isValidPort(80)).toBe(true);
      expect(isValidPort(443)).toBe(true);
      expect(isValidPort(8080)).toBe(true);
      expect(isValidPort(65535)).toBe(true);
      expect(isValidPort(1)).toBe(true);
    });

    it('should validate port strings', () => {
      expect(isValidPort('80')).toBe(true);
      expect(isValidPort('443')).toBe(true);
      expect(isValidPort('8080')).toBe(true);
    });

    it('should reject invalid port numbers', () => {
      expect(isValidPort(0)).toBe(false);
      expect(isValidPort(-1)).toBe(false);
      expect(isValidPort(65536)).toBe(false);
      expect(isValidPort(70000)).toBe(false);
      expect(isValidPort('abc')).toBe(false);
      expect(isValidPort('')).toBe(false);
    });
  });

  describe('validateAddressComponents', () => {
    it('should validate complete address components', () => {
      const result = validateAddressComponents({
        protocol: 'ip4',
        host: '192.168.1.1',
        port: 8080,
        path: '/tcp'
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return errors for invalid components', () => {
      const result = validateAddressComponents({
        protocol: 'invalid',
        host: '256.256.256.256',
        port: 70000,
        path: ''
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid protocol: invalid');
      expect(result.errors).toContain('Invalid IP address: 256.256.256.256');
      expect(result.errors).toContain('Invalid port: 70000');
    });

    it('should validate IPv6 components', () => {
      const result = validateAddressComponents({
        protocol: 'ip6',
        host: '2001:db8::1',
        port: 443,
        path: '/tcp/https'
      });

      expect(result.isValid).toBe(true);
    });

    it('should validate domain components', () => {
      const result = validateAddressComponents({
        protocol: 'dns4',
        host: 'api.government.gov',
        port: 443,
        path: '/tcp/https'
      });

      expect(result.isValid).toBe(true);
    });
  });

  describe('sanitizeAddress', () => {
    it('should normalize IPv4 addresses', () => {
      expect(sanitizeAddress('/ip4/192.168.01.01/tcp/8080'))
        .toBe('/ip4/192.168.1.1/tcp/8080');
    });

    it('should normalize port numbers', () => {
      expect(sanitizeAddress('/ip4/127.0.0.1/tcp/08080'))
        .toBe('/ip4/127.0.0.1/tcp/8080');
    });

    it('should lowercase domain names', () => {
      expect(sanitizeAddress('/dns4/API.GOVERNMENT.GOV/tcp/443'))
        .toBe('/dns4/api.government.gov/tcp/443');
    });

    it('should remove extra slashes', () => {
      expect(sanitizeAddress('//ip4//127.0.0.1//tcp//8080'))
        .toBe('/ip4/127.0.0.1/tcp/8080');
    });

    it('should trim whitespace', () => {
      expect(sanitizeAddress('  /ip4/127.0.0.1/tcp/8080  '))
        .toBe('/ip4/127.0.0.1/tcp/8080');
    });

    it('should handle empty or null input', () => {
      expect(sanitizeAddress('')).toBe('');
      expect(sanitizeAddress(null as any)).toBe('');
      expect(sanitizeAddress(undefined as any)).toBe('');
    });
  });
});