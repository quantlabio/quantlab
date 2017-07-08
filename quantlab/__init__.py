"""Server extension for QuantLab."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from ._version import __version__
from .extension import load_jupyter_server_extension

def _jupyter_server_extension_paths():
    return [{
        "module": "quantlab"
    }]
