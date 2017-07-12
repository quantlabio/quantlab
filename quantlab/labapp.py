# coding: utf-8
"""A tornado based Quant lab server."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from notebook.notebookapp import NotebookApp, aliases, flags
from jupyter_core.application import JupyterApp, base_aliases

from traitlets import Bool, Unicode

from ._version import __version__
from .extension import load_jupyter_server_extension
from .commands import build, clean, get_app_dir


build_aliases = dict(base_aliases)
build_aliases['app-dir'] = 'LabBuildApp.app_dir'
build_aliases['name'] = 'LabBuildApp.name'
build_aliases['version'] = 'LabBuildApp.version'


class LabBuildApp(JupyterApp):
    version = __version__
    description = """
    Build the QuantLab application

    The application is built in the QuantLab app directory in `/staging`.
    When the build is complete it is put in the QuantLab app `/static`
    directory, where it is used to serve the application.
    """
    aliases = build_aliases

    app_dir = Unicode('', config=True,
        help="The app directory to build in")

    name = Unicode('QuantLab', config=True,
        help="The name of the built application")

    version = Unicode('', config=True,
        help="The version of the built application")

    def start(self):
        build(self.app_dir, self.name, self.version)


clean_aliases = dict(base_aliases)
clean_aliases['app-dir'] = 'LabCleanApp.app_dir'


class LabCleanApp(JupyterApp):
    version = __version__
    description = """
    Clean the QuantLab application

    This will clean the app directory by removing the `staging` and `static`
    directories.
    """
    aliases = clean_aliases

    app_dir = Unicode('', config=True,
        help="The app directory to clean")

    def start(self):
        clean(self.app_dir)


class LabPathApp(JupyterApp):
    version = __version__
    description = """
    Print the configured path to the QuantLab application

    The path can be configured using the QUANTLAB_DIR environment variable.
    """

    def start(self):
        print(get_app_dir())


lab_aliases = dict(aliases)
lab_aliases['app-dir'] = 'LabApp.app_dir'

lab_flags = dict(flags)
lab_flags['core-mode'] = (
    {'LabApp': {'core_mode': True}},
    "Start the app in core mode."
)
lab_flags['dev-mode'] = (
    {'LabApp': {'core_mode': True}},
    "Start the app in dev mode for running from source."
)


class LabApp(NotebookApp):
    version = __version__

    description = """
    QuantLab - An extensible computational environment for Jupyter.

    This launches a Tornado based HTML Server that serves up an
    HTML5/Javascript QuantLab client.

    QuantLab has three different modes of running:

    * Core mode (`--core-mode`): in this mode QuantLab will run using the JavaScript
      assets contained in the installed `quantlab` Python package. In core mode, no
      extensions are enabled. This is the default in a stable QuantLab release if you
      have no extensions installed.
    * Dev mode (`--dev-mode`): like core mode, but when the `quantlab` Python package
      is installed from source and installed using `pip install -e .`. In this case
      QuantLab will show a red stripe at the top of the page.
    * App mode: QuantLab allows multiple QuantLab "applications" to be
      created by the user with different combinations of extensions. The `--app-dir` can
      be used to set a directory for different applications. The default application
      path can be found using `jupyter quantlab path`.
    """

    examples = """
        jupyter quantlab                       # start QuantLab
        jupyter quantlab --dev-mode            # start QuantLab in development mode, with no extensions
        jupyter quantlab --core-mode           # start QuantLab in core mode, with no extensions
        jupyter quantlab --app-dir=~/myquantlabapp # start QuantLab with a particular set of extensions
        jupyter quantlab --certfile=mycert.pem # use SSL/TLS certificate
    """

    aliases = lab_aliases
    flags = lab_flags

    subcommands = dict(
        build=(LabBuildApp, LabBuildApp.description.splitlines()[0]),
        clean=(LabCleanApp, LabCleanApp.description.splitlines()[0]),
        path=(LabPathApp, LabPathApp.description.splitlines()[0])
    )

    default_url = Unicode('/quantlab', config=True,
        help="The default URL to redirect to from `/`")

    app_dir = Unicode('', config=True,
        help="The app directory to launch QuantLab from.")

    core_mode = Bool(False, config=True,
        help="""Whether to start the app in core mode. In this mode, QuantLab
        will run using the JavaScript assets that are within the installed
        QuantLab Python package. In core mode, third party extensions are disabled.
        The `--dev-mode` flag is an alias to this to be used when the Python package
        itself is installed in development mode (`pip install -e .`).
        """)

    def init_server_extensions(self):
        """Load any extensions specified by config.

        Import the module, then call the load_jupyter_server_extension function,
        if one exists.

        If the QuantLab server extension is not enabled, it will
        be manually loaded with a warning.

        The extension API is experimental, and may change in future releases.
        """
        super(LabApp, self).init_server_extensions()
        msg = 'QuantLab server extension not enabled, manually loading...'
        if not self.nbserver_extensions.get('quantlab', False):
            self.log.warn(msg)
            load_jupyter_server_extension(self)


#-----------------------------------------------------------------------------
# Main entry point
#-----------------------------------------------------------------------------

main = launch_new_instance = LabApp.launch_instance
