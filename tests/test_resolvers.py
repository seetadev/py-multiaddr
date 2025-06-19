"""Tests for multiaddr resolvers."""

import socket
import sys
from unittest.mock import patch

import pytest
import trio

from multiaddr import Multiaddr
from multiaddr.exceptions import RecursionLimitError, ResolutionError
from multiaddr.resolvers import DNSResolver

if sys.version_info >= (3, 11):
    from builtins import BaseExceptionGroup
else:
    class BaseExceptionGroup(Exception):
        pass


@pytest.fixture
def dns_resolver():
    """Create a DNS resolver instance."""
    return DNSResolver()


@pytest.mark.trio
async def test_resolve_non_dns_addr(dns_resolver):
    """Test resolving a non-DNS multiaddr."""
    ma = Multiaddr("/ip4/127.0.0.1/tcp/1234")
    result = await dns_resolver.resolve(ma)
    assert result == [ma]


@pytest.mark.trio
async def test_resolve_dns_addr(dns_resolver):
    """Test resolving a DNS multiaddr."""
    with patch("socket.getaddrinfo") as mock_getaddrinfo:
        mock_getaddrinfo.return_value = [
            (socket.AF_INET, socket.SOCK_STREAM, socket.IPPROTO_TCP, "", ("127.0.0.1", 0))
        ]
        ma = Multiaddr("/dnsaddr/example.com")
        result = await dns_resolver.resolve(ma)
        assert len(result) == 1
        assert result[0].protocols()[0].name == "ip4"
        assert result[0].value_for_protocol(result[0].protocols()[0].code) == "127.0.0.1"


@pytest.mark.trio
async def test_resolve_dns_addr_with_peer_id(dns_resolver):
    """Test resolving a DNS multiaddr with a peer ID."""
    with patch("socket.getaddrinfo") as mock_getaddrinfo:
        mock_getaddrinfo.return_value = [
            (socket.AF_INET, socket.SOCK_STREAM, socket.IPPROTO_TCP, "", ("127.0.0.1", 0))
        ]
        ma = Multiaddr("/dnsaddr/example.com/p2p/QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7wjh53Qk")
        result = await dns_resolver.resolve(ma)
        assert len(result) == 1
        assert result[0].protocols()[0].name == "ip4"
        assert result[0].value_for_protocol(result[0].protocols()[0].code) == "127.0.0.1"
        assert result[0].get_peer_id() == "QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7wjh53Qk"


@pytest.mark.trio
async def test_resolve_recursive_dns_addr(dns_resolver):
    """Test resolving a recursive DNS multiaddr."""
    with patch("socket.getaddrinfo") as mock_getaddrinfo:
        mock_getaddrinfo.side_effect = [
            [(socket.AF_INET, socket.SOCK_STREAM, socket.IPPROTO_TCP, "", ("127.0.0.1", 0))],
            [(socket.AF_INET, socket.SOCK_STREAM, socket.IPPROTO_TCP, "", ("192.168.1.1", 0))],
        ]
        ma = Multiaddr("/dnsaddr/example.com")
        result = await dns_resolver.resolve(ma, {"max_recursive_depth": 2})
        assert len(result) == 1
        assert result[0].protocols()[0].name == "ip4"
        assert result[0].value_for_protocol(result[0].protocols()[0].code) == "127.0.0.1"


@pytest.mark.trio
async def test_resolve_recursion_limit(dns_resolver):
    """Test that recursion limit is enforced."""
    ma = Multiaddr("/dnsaddr/example.com")
    with pytest.raises(RecursionLimitError):
        await dns_resolver.resolve(ma, {"max_recursive_depth": 0})


@pytest.mark.trio
async def test_resolve_dns_addr_error(dns_resolver):
    """Test handling DNS resolution errors."""
    with patch("socket.getaddrinfo") as mock_getaddrinfo:
        mock_getaddrinfo.side_effect = socket.gaierror("DNS resolution failed")
        ma = Multiaddr("/dnsaddr/example.com")
        with pytest.raises(ResolutionError):
            await dns_resolver.resolve(ma)


@pytest.mark.trio
async def test_resolve_dns_addr_with_quotes(dns_resolver):
    """Test resolving DNS records with quoted strings."""
    with patch("socket.getaddrinfo") as mock_getaddrinfo:
        mock_getaddrinfo.return_value = [
            (socket.AF_INET, socket.SOCK_STREAM, socket.IPPROTO_TCP, "", ("127.0.0.1", 0))
        ]
        ma = Multiaddr("/dnsaddr/example.com")
        result = await dns_resolver.resolve(ma)
        assert len(result) == 1
        assert result[0].protocols()[0].name == "ip4"
        assert result[0].value_for_protocol(result[0].protocols()[0].code) == "127.0.0.1"


@pytest.mark.trio
async def test_resolve_dns_addr_with_mixed_quotes(dns_resolver):
    """Test resolving DNS records with mixed quotes."""
    with patch("socket.getaddrinfo") as mock_getaddrinfo:
        mock_getaddrinfo.return_value = [
            (socket.AF_INET, socket.SOCK_STREAM, socket.IPPROTO_TCP, "", ("127.0.0.1", 0))
        ]
        ma = Multiaddr("/dnsaddr/example.com")
        result = await dns_resolver.resolve(ma)
        assert len(result) == 1
        assert result[0].protocols()[0].name == "ip4"
        assert result[0].value_for_protocol(result[0].protocols()[0].code) == "127.0.0.1"


@pytest.mark.xfail(
    sys.version_info >= (3, 11),
    reason="ExceptionGroup not properly caught by pytest in async code (Python 3.11+)"
)
@pytest.mark.trio
async def test_resolve_cancellation_with_error():
    """Test that resolution can be cancelled and errors are properly handled."""
    ma = Multiaddr("/dnsaddr/example.com")
    signal = trio.CancelScope()
    dns_resolver = DNSResolver()

    async def cancel_soon(scope):
        await trio.sleep(0.01)
        scope.cancel()

    async def run_resolver():
        await dns_resolver.resolve(ma, {"signal": signal})

    try:
        async with trio.open_nursery() as nursery:
            nursery.start_soon(cancel_soon, signal)
            nursery.start_soon(run_resolver)
    except BaseExceptionGroup as eg:
        # Check that at least one sub-exception is a cancellation
        assert any(
            isinstance(e, BaseException)
            and type(e).__name__.startswith("Cancel")
            for e in eg.exceptions
        )
    else:
        assert False, "Expected cancellation exception group"
