import { ip4Codec, ip6Codec, uint16beCodec, utf8Codec, domainCodec } from '../../src/lib/codecs';
import { InvalidAddressError } from '../../src/lib/exceptions';

describe('Codecs', () => {
  describe('ip4Codec', () => {
    it('should encode valid IPv4 address', () => {
      const result = ip4Codec.encode('192.168.1.1');
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(4);
    });

    it('should decode IPv4 buffer to string', () => {
      const buffer = Buffer.from([192, 168, 1, 1]);
      const result = ip4Codec.decode(buffer);
      expect(result).toBe('192.168.1.1');
    });

    it('should handle localhost address', () => {
      const encoded = ip4Codec.encode('127.0.0.1');
      const decoded = ip4Codec.decode(encoded);
      expect(decoded).toBe('127.0.0.1');
    });

    it('should throw error for invalid IPv4', () => {
      expect(() => ip4Codec.encode('256.256.256.256')).toThrow(InvalidAddressError);
      expect(() => ip4Codec.encode('192.168.1')).toThrow(InvalidAddressError);
      expect(() => ip4Codec.encode('not-an-ip')).toThrow(InvalidAddressError);
    });

    it('should validate IPv4 format', () => {
      expect(ip4Codec.isValid('192.168.1.1')).toBe(true);
      expect(ip4Codec.isValid('0.0.0.0')).toBe(true);
      expect(ip4Codec.isValid('255.255.255.255')).toBe(true);
      expect(ip4Codec.isValid('256.1.1.1')).toBe(false);
      expect(ip4Codec.isValid('192.168.1')).toBe(false);
    });
  });

  describe('ip6Codec', () => {
    it('should encode valid IPv6 address', () => {
      const result = ip6Codec.encode('2001:db8::1');
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(16);
    });

    it('should decode IPv6 buffer to string', () => {
      const buffer = Buffer.alloc(16);
      buffer[0] = 0x20; buffer[1] = 0x01;
      buffer[2] = 0x0d; buffer[3] = 0xb8;
      buffer[15] = 0x01;
      const result = ip6Codec.decode(buffer);
      expect(result.toLowerCase()).toBe('2001:db8::1');
    });

    it('should handle localhost IPv6', () => {
      const encoded = ip6Codec.encode('::1');
      const decoded = ip6Codec.decode(encoded);
      expect(decoded.toLowerCase()).toBe('::1');
    });

    it('should throw error for invalid IPv6', () => {
      expect(() => ip6Codec.encode('invalid-ipv6')).toThrow(InvalidAddressError);
      expect(() => ip6Codec.encode('192.168.1.1')).toThrow(InvalidAddressError);
    });

    it('should validate IPv6 format', () => {
      expect(ip6Codec.isValid('2001:db8::1')).toBe(true);
      expect(ip6Codec.isValid('::1')).toBe(true);
      expect(ip6Codec.isValid('::')).toBe(true);
      expect(ip6Codec.isValid('invalid')).toBe(false);
    });
  });

  describe('uint16beCodec', () => {
    it('should encode port numbers correctly', () => {
      const result = uint16beCodec.encode('8080');
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(2);
      expect(result.readUInt16BE(0)).toBe(8080);
    });

    it('should decode buffer to port string', () => {
      const buffer = Buffer.alloc(2);
      buffer.writeUInt16BE(3000, 0);
      const result = uint16beCodec.decode(buffer);
      expect(result).toBe('3000');
    });

    it('should handle edge port values', () => {
      expect(uint16beCodec.decode(uint16beCodec.encode('0'))).toBe('0');
      expect(uint16beCodec.decode(uint16beCodec.encode('65535'))).toBe('65535');
    });

    it('should throw error for invalid port numbers', () => {
      expect(() => uint16beCodec.encode('65536')).toThrow(InvalidAddressError);
      expect(() => uint16beCodec.encode('-1')).toThrow(InvalidAddressError);
      expect(() => uint16beCodec.encode('not-a-number')).toThrow(InvalidAddressError);
    });

    it('should validate port numbers', () => {
      expect(uint16beCodec.isValid('0')).toBe(true);
      expect(uint16beCodec.isValid('8080')).toBe(true);
      expect(uint16beCodec.isValid('65535')).toBe(true);
      expect(uint16beCodec.isValid('65536')).toBe(false);
      expect(uint16beCodec.isValid('abc')).toBe(false);
    });
  });

  describe('utf8Codec', () => {
    it('should encode UTF-8 strings', () => {
      const result = utf8Codec.encode('hello world');
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString('utf8')).toBe('hello world');
    });

    it('should decode UTF-8 buffers', () => {
      const buffer = Buffer.from('hello world', 'utf8');
      const result = utf8Codec.decode(buffer);
      expect(result).toBe('hello world');
    });

    it('should handle unicode characters', () => {
      const text = 'Hello 世界 🌍';
      const encoded = utf8Codec.encode(text);
      const decoded = utf8Codec.decode(encoded);
      expect(decoded).toBe(text);
    });

    it('should handle empty strings', () => {
      const encoded = utf8Codec.encode('');
      const decoded = utf8Codec.decode(encoded);
      expect(decoded).toBe('');
    });

    it('should validate UTF-8 strings', () => {
      expect(utf8Codec.isValid('hello')).toBe(true);
      expect(utf8Codec.isValid('hello world')).toBe(true);
      expect(utf8Codec.isValid('')).toBe(true);
      expect(utf8Codec.isValid('Hello 世界')).toBe(true);
    });
  });

  describe('domainCodec', () => {
    it('should encode domain names', () => {
      const result = domainCodec.encode('example.com');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should decode domain buffers', () => {
      const encoded = domainCodec.encode('example.com');
      const decoded = domainCodec.decode(encoded);
      expect(decoded).toBe('example.com');
    });

    it('should handle subdomains', () => {
      const domain = 'api.billing.government.gov';
      const encoded = domainCodec.encode(domain);
      const decoded = domainCodec.decode(encoded);
      expect(decoded).toBe(domain);
    });

    it('should validate domain names', () => {
      expect(domainCodec.isValid('example.com')).toBe(true);
      expect(domainCodec.isValid('api.government.gov')).toBe(true);
      expect(domainCodec.isValid('localhost')).toBe(true);
      expect(domainCodec.isValid('')).toBe(false);
      expect(domainCodec.isValid('invalid..domain')).toBe(false);
    });
  });
});