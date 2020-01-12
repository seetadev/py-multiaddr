import base58

from . import LENGTH_PREFIXED_VAR_SIZE


SIZE = LENGTH_PREFIXED_VAR_SIZE
IS_PATH = False


def to_bytes(proto, string):
    mm = base58.b58decode(string)
    if len(mm) < 5:
        raise ValueError("P2P MultiHash too short: len() < 5")
    return mm


def to_string(proto, buf):
    return base58.b58encode(buf).decode('ascii')
