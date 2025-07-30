import { getProtocol, getProtocolByName, getProtocolByCode, isValidProtocol } from '../../src/lib/protocols';
import { ProtocolError } from '../../src/lib/exceptions';

describe('Protocols', () => {
  describe('getProtocolByName', () => {
    it('should return correct protocol for valid name', () => {
      const protocol = getProtocolByName('ip4');
      expect(protocol.name).toBe('ip4');
      expect(protocol.code).toBe(4);
      expect(protocol.size).toBe(32);
    });

    it('should return correct protocol for tcp', () => {
      const protocol = getProtocolByName('tcp');
      expect(protocol.name).toBe('tcp');
      expect(protocol.code).toBe(6);
      expect(protocol.size).toBe(16);
    });

    it('should throw error for invalid protocol name', () => {
      expect(() => getProtocolByName('invalid-protocol')).toThrow(ProtocolError);
    });

    it('should be case sensitive', () => {
      expect(() => getProtocolByName('TCP')).toThrow(ProtocolError);
    });
  });

  describe('getProtocolByCode', () => {
    it('should return correct protocol for valid code', () => {
      const protocol = getProtocolByCode(4);
      expect(protocol.name).toBe('ip4');
      expect(protocol.code).toBe(4);
    });

    it('should return correct protocol for tcp code', () => {
      const protocol = getProtocolByCode(6);
      expect(protocol.name).toBe('tcp');
      expect(protocol.code).toBe(6);
    });

    it('should throw error for invalid protocol code', () => {
      expect(() => getProtocolByCode(99999)).toThrow(ProtocolError);
    });

    it('should handle zero code', () => {
      expect(() => getProtocolByCode(0)).toThrow(ProtocolError);
    });
  });

  describe('isValidProtocol', () => {
    it('should return true for valid protocol names', () => {
      expect(isValidProtocol('ip4')).toBe(true);
      expect(isValidProtocol('ip6')).toBe(true);
      expect(isValidProtocol('tcp')).toBe(true);
      expect(isValidProtocol('udp')).toBe(true);
      expect(isValidProtocol('http')).toBe(true);
      expect(isValidProtocol('https')).toBe(true);
    });

    it('should return false for invalid protocol names', () => {
      expect(isValidProtocol('invalid')).toBe(false);
      expect(isValidProtocol('')).toBe(false);
      expect(isValidProtocol('TCP')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(isValidProtocol(null as any)).toBe(false);
      expect(isValidProtocol(undefined as any)).toBe(false);
    });
  });

  describe('protocol properties', () => {
    it('should have correct properties for ip4', () => {
      const protocol = getProtocolByName('ip4');
      expect(protocol).toMatchObject({
        name: 'ip4',
        code: 4,
        size: 32
      });
    });

    it('should have correct properties for ip6', () => {
      const protocol = getProtocolByName('ip6');
      expect(protocol).toMatchObject({
        name: 'ip6',
        code: 41,
        size: 128
      });
    });

    it('should have variable size protocols', () => {
      const protocol = getProtocolByName('dns4');
      expect(protocol.size).toBe(-1); // Variable size
    });
  });

  describe('protocol validation edge cases', () => {
    it('should handle onion protocols', () => {
      const onion = getProtocolByName('onion');
      expect(onion.name).toBe('onion');
      expect(onion.size).toBe(96);
    });

    it('should handle onion3 protocols', () => {
      const onion3 = getProtocolByName('onion3');
      expect(onion3.name).toBe('onion3');
      expect(onion3.size).toBe(296);
    });

    it('should handle unix socket protocol', () => {
      const unix = getProtocolByName('unix');
      expect(unix.name).toBe('unix');
      expect(unix.size).toBe(-1);
    });
  });
});