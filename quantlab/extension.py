# coding: utf-8
"""A tornado based Quant Lab server."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.
import os

from quantlab_launcher import add_handlers, QuantLabConfig

from .commands import get_app_dir, list_extensions, should_build
from ._version import __version__

#-----------------------------------------------------------------------------
# Module globals
#-----------------------------------------------------------------------------

DEV_NOTE_NPM = """You're running QuantLab from source.
If you're working on the TypeScript sources of QuantLab, try running

    npm run watch

from the QuantLab repo directory in another terminal window to have the
system incrementally watch and build QuantLab's TypeScript for you, as you
make changes.
"""


CORE_NOTE = """
Running the core application with no additional extensions or settings
"""


def load_jupyter_server_extension(nbapp):
    """Load the QuantLab server extension.
    """
    # Print messages.
    here = os.path.dirname(__file__)
    nbapp.log.info('QuantLab alpha preview extension loaded from %s' % here)

    app_dir = get_app_dir()
    if hasattr(nbapp, 'app_dir'):
        app_dir = get_app_dir(nbapp.app_dir)

    web_app = nbapp.web_app
    config = QuantLabConfig()

    config.assets_dir = os.path.join(app_dir, 'static')
    config.settings_dir = os.path.join(app_dir, 'settings')
    config.page_title = 'QuantLab Alpha Preview'
    config.page_url = '/quantlab'
    config.dev_mode = False

    # Check for core mode.
    core_mode = ''
    if hasattr(nbapp, 'core_mode'):
        core_mode = nbapp.core_mode

    # Check for an app dir that is local.
    if app_dir == here or app_dir == os.path.join(here, 'build'):
        core_mode = True
        config.settings_dir = ''

    # Run core mode if explicit or there is no static dir and no
    # installed extensions.
    installed = list_extensions(app_dir)
    fallback = not installed and not os.path.exists(config.assets_dir)

    web_app.settings.setdefault('page_config_data', dict())
    web_app.settings['page_config_data']['token'] = nbapp.token

    if not core_mode:
        build_needed, msg = should_build(app_dir)
        if build_needed:
            nbapp.log.warn('Build required: %s' % msg)
            web_app.settings['page_config_data']['buildRequired'] = msg

    if core_mode or fallback:
        config.assets_dir = os.path.join(here, 'build')
        if not os.path.exists(config.assets_dir):
            msg = 'Static assets not built, please see CONTRIBUTING.md'
            nbapp.log.error(msg)
        else:
            sentinel = os.path.join(here, 'build', 'release_data.json')
            config.dev_mode = not os.path.exists(sentinel)

    if config.dev_mode:
        nbapp.log.info(DEV_NOTE_NPM)
    elif core_mode or fallback:
        nbapp.log.info(CORE_NOTE.strip())

    add_handlers(web_app, config)
