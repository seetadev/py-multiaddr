# py-multiaddr

A Python implementation of the multiaddr format, providing a self-describing network address format for future-proof networking. This library enables encoding of multiple layers of addressing information into a single, self-describing address format that is human-readable and machine-parsable.

## 🚀 Features

- **Self-describing network addresses**: Encode multiple layers of addressing information into a single format
- **Protocol codec system**: Support for IP4, IP6, TCP, UDP, DNS, Onion, and many more protocols
- **Address resolution**: DNS and DNSAddr resolver implementations for dynamic address resolution
- **Thin waist validation**: Extract and validate core network addresses with wildcard expansion
- **Address manipulation**: Encapsulate, decapsulate, and transform multiaddresses programmatically
- **Protocol stack analysis**: Analyze and inspect complex network protocol stacks
- **CID support**: Content Identifier integration for IPFS compatibility
- **Onion address support**: Tor hidden service address encoding (v2 and v3)
- **Comprehensive testing**: Full test coverage with examples and edge case handling

## 🛠️ Tech Stack

### Core Technologies
- **Python**: Primary implementation language
- **IPFS/libp2p**: Compatible with IPFS multiaddr specification
- **Network Protocols**: Support for TCP, UDP, QUIC, WebSocket, and more

### Development Tools
- **Tox**: Testing automation across multiple Python versions
- **Ruff**: Modern Python linter and formatter
- **Sphinx**: Documentation generation
- **CodeCov**: Test coverage reporting
- **GitHub Actions**: CI/CD automation with Claude AI integrations

### Testing Framework
- **pytest**: Testing framework with comprehensive test suites
- **Coverage**: Code coverage analysis
- **Towncrier**: Changelog management

## 📁 Project Structure

```
py-multiaddr/
├── multiaddr/              # Core library implementation
│   ├── codecs/            # Protocol-specific encoding/decoding
│   ├── resolvers/         # Address resolution (DNS, DNSAddr)
│   ├── multiaddr.py       # Main multiaddr class
│   ├── protocols.py       # Protocol definitions
│   └── transforms.py      # Address transformation utilities
├── examples/              # Usage examples and demonstrations
│   ├── decapsulate/       # Protocol layer removal examples
│   ├── dns/              # DNS resolution examples
│   ├── dnsaddr/          # DNSAddr resolution examples
│   └── thin_waist/       # Address validation examples
├── tests/                # Comprehensive test suite
├── docs/                 # Sphinx documentation
└── newsfragments/        # Changelog fragments
```

## 🔧 Installation & Setup

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Installation Steps

#### From PyPI (Recommended)
```bash
pip install py-multiaddr
```

#### From Source
```bash
# Clone the repository
git clone https://github.com/anisharma07/py-multiaddr.git
cd py-multiaddr

# Install in development mode
pip install -e .

# Or install with development dependencies
pip install -e ".[dev]"
```

#### Using Poetry
```bash
poetry install
```

## 🎯 Usage

### Basic Usage

```python
from multiaddr import Multiaddr

# Create a multiaddr
addr = Multiaddr('/ip4/127.0.0.1/tcp/8080')
print(addr)  # /ip4/127.0.0.1/tcp/8080

# Parse from string
addr = Multiaddr('/dns/example.com/tcp/443/https')

# Access protocols
for protocol, value in addr.items():
    print(f"{protocol.name}: {value}")

# Encapsulate additional protocols
new_addr = addr.encapsulate('/ws/path')
print(new_addr)  # /dns/example.com/tcp/443/https/ws/path

# Decapsulate protocols
base_addr = new_addr.decapsulate('/ws')
print(base_addr)  # /dns/example.com/tcp/443/https
```

### Advanced Examples

#### DNS Resolution
```python
from multiaddr.resolvers import DNSResolver

resolver = DNSResolver()
addresses = resolver.resolve('/dns/example.com/tcp/80')
for addr in addresses:
    print(addr)
```

#### Thin Waist Address Validation
```python
from multiaddr.transforms import to_thin_waist_addresses

# Expand wildcard addresses to all interfaces
addresses = to_thin_waist_addresses([
    Multiaddr('/ip4/0.0.0.0/tcp/8080'),
    Multiaddr('/ip6/::/tcp/8080')
])

for addr in addresses:
    print(addr)
```

#### Protocol Stack Analysis
```python
addr = Multiaddr('/ip4/192.168.1.100/tcp/8080/http/ws/path')

# Analyze protocol layers
for i, (protocol, value) in enumerate(addr.items()):
    print(f"Layer {i}: {protocol.name} = {value}")

# Decapsulate by protocol code
tcp_removed = addr.decapsulate_code(6)  # TCP protocol code
print(tcp_removed)
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
python -m pytest

# Run with coverage
python -m pytest --cov=multiaddr --cov-report=html

# Run specific test file
python -m pytest tests/test_multiaddr.py

# Run with tox (multiple Python versions)
tox
```

### Run Examples
```bash
# Basic decapsulation examples
python examples/decapsulate/decapsulate_example.py

# DNS resolution examples
python examples/dns/dns_examples.py

# Thin waist validation examples
python examples/thin_waist/thin_waist_example.py

# Advanced examples with detailed output
python examples/thin_waist/thin_waist_example.py --detailed
```

## 🔄 Development

### Setup Development Environment
```bash
# Clone and install in development mode
git clone https://github.com/anisharma07/py-multiaddr.git
cd py-multiaddr
pip install -e ".[dev]"

# Run linting
ruff check .
ruff format .

# Build documentation
cd docs
make html
```

### Build and Release
```bash
# Build package
python -m build

# Upload to PyPI (maintainers only)
python -m twine upload dist/*
```

## 📱 Platform Support

- **Python 3.8+**: Cross-platform support
- **Linux**: Full support with all features
- **macOS**: Full support with all features  
- **Windows**: Full support with all features
- **Docker**: Container deployment ready

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 style guidelines (enforced by Ruff)
- Add tests for new functionality
- Update documentation for API changes
- Add changelog fragments in `newsfragments/`
- Ensure all tests pass across supported Python versions

### Code Style
```bash
# Format code
ruff format .

# Check for issues
ruff check .

# Fix auto-fixable issues
ruff check --fix .
```

## 📄 License

This project is dual-licensed under:
- **MIT License** - see [LICENSE-MIT](LICENSE-MIT)
- **Apache License 2.0** - see [LICENSE-APACHE2](LICENSE-APACHE2)

You may choose either license for your use.

## 🙏 Acknowledgments

- **IPFS/libp2p community** for the multiaddr specification
- **Protocol Labs** for the original concept and standards
- All contributors who have helped improve this library

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/anisharma07/py-multiaddr/issues)
- **Discussions**: [GitHub Discussions](https://github.com/anisharma07/py-multiaddr/discussions)
- **Documentation**: [Read the Docs](https://py-multiaddr.readthedocs.io/)

For security issues, please see our security policy in the repository.

---

**Note**: This library implements the multiaddr specification as used by IPFS and libp2p. For the official specification, visit [multiformats/multiaddr](https://github.com/multiformats/multiaddr).