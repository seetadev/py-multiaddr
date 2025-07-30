import { Multiaddr } from '../../src/lib/multiaddr';
import { ProtocolError, InvalidAddressError } from '../../src/lib/exceptions';

describe('Multiaddr', () => {
  describe('constructor', () => {
    it('should create multiaddr from string', () => {
      const addr = new Multiaddr('/ip4/127.0.0.1/tcp/8080');
      expect(addr.toString()).toBe('/ip4/127.0.0.1/tcp/8080');
    });

    it('should create multiaddr from buffer', () => {
      const buffer = Buffer.from([0x04, 0x7f, 0x00, 0x00, 0x01, 0x06, 0x1f, 0x90]);
      const addr = new Multiaddr(buffer);
      expect(addr.toString()).toBe('/ip4/127.0.0.1/tcp/8080');
    });

    it('should throw error for invalid address format', () => {
      expect(() => new Multiaddr('invalid-address')).toThrow(InvalidAddressError);
    });

    it('should handle empty address', () => {
      const addr = new Multiaddr('');
      expect(addr.toString()).toBe('');
    });
  });

  describe('protocols', () => {
    it('should return correct protocols for address', () => {
      const addr = new Multiaddr('/ip4/127.0.0.1/tcp/8080/http');
      const protocols = addr.protocols();
      expect(protocols).toHaveLength(3);
      expect(protocols[0].name).toBe('ip4');
      expect(protocols[1].name).toBe('tcp');
      expect(protocols[2].name).toBe('http');
    });

    it('should return empty array for empty address', () => {
      const addr = new Multiaddr('');
      expect(addr.protocols()).toEqual([]);
    });
  });

  describe('encapsulate', () => {
    it('should encapsulate another multiaddr', () => {
      const addr1 = new Multiaddr('/ip4/127.0.0.1');
      const addr2 = new Multiaddr('/tcp/8080');
      const result = addr1.encapsulate(addr2);
      expect(result.toString()).toBe('/ip4/127.0.0.1/tcp/8080');
    });

    it('should encapsulate string address', () => {
      const addr = new Multiaddr('/ip4/127.0.0.1');
      const result = addr.encapsulate('/tcp/8080');
      expect(result.toString()).toBe('/ip4/127.0.0.1/tcp/8080');
    });
  });

  describe('decapsulate', () => {
    it('should decapsulate protocol', () => {
      const addr = new Multiaddr('/ip4/127.0.0.1/tcp/8080/http');
      const result = addr.decapsulate('/tcp/8080/http');
      expect(result.toString()).toBe('/ip4/127.0.0.1');
    });

    it('should throw error if protocol not found', () => {
      const addr = new Multiaddr('/ip4/127.0.0.1/tcp/8080');
      expect(() => addr.decapsulate('/udp/1234')).toThrow(ProtocolError);
    });
  });

  describe('nodeAddress', () => {
    it('should return node address for ip4/tcp', () => {
      const addr = new Multiaddr('/ip4/192.168.1.1/tcp/3000');
      const nodeAddr = addr.nodeAddress();
      expect(nodeAddr.family).toBe('IPv4');
      expect(nodeAddr.address).toBe('192.168.1.1');
      expect(nodeAddr.port).toBe(3000);
    });

    it('should return node address for ip6/tcp', () => {
      const addr = new Multiaddr('/ip6/::1/tcp/8080');
      const nodeAddr = addr.nodeAddress();
      expect(nodeAddr.family).toBe('IPv6');
      expect(nodeAddr.address).toBe('::1');
      expect(nodeAddr.port).toBe(8080);
    });

    it('should throw error for non-ip address', () => {
      const addr = new Multiaddr('/unix/tmp/socket');
      expect(() => addr.nodeAddress()).toThrow(ProtocolError);
    });
  });

  describe('equals', () => {
    it('should return true for equal addresses', () => {
      const addr1 = new Multiaddr('/ip4/127.0.0.1/tcp/8080');
      const addr2 = new Multiaddr('/ip4/127.0.0.1/tcp/8080');
      expect(addr1.equals(addr2)).toBe(true);
    });

    it('should return false for different addresses', () => {
      const addr1 = new Multiaddr('/ip4/127.0.0.1/tcp/8080');
      const addr2 = new Multiaddr('/ip4/192.168.1.1/tcp/8080');
      expect(addr1.equals(addr2)).toBe(false);
    });
  });

  describe('buffer operations', () => {
    it('should convert to buffer correctly', () => {
      const addr = new Multiaddr('/ip4/127.0.0.1/tcp/8080');
      const buffer = addr.buffer;
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should maintain consistency between string and buffer', () => {
      const original = '/ip4/192.168.1.1/tcp/3000';
      const addr1 = new Multiaddr(original);
      const addr2 = new Multiaddr(addr1.buffer);
      expect(addr1.toString()).toBe(addr2.toString());
    });
  });
});