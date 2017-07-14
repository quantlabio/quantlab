# coding: utf-8
"""Jupyter QuantLabExtension Entry Points."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.
from __future__ import print_function

import os
import sys

from jupyter_core.application import JupyterApp, base_flags, base_aliases

from traitlets import Bool, Unicode

from ._version import __version__
from .commands import (
    install_extension, uninstall_extension, list_extensions,
    enable_extension, disable_extension,
    link_package, unlink_package, build, _get_linked_packages
)


flags = dict(base_flags)
flags['no-build'] = (
    {'BaseExtensionApp': {'should_build': False}},
    "Defer building the app after the action."
)

aliases = dict(base_aliases)
aliases['app-dir'] = 'BaseExtensionApp.app_dir'


class BaseExtensionApp(JupyterApp):
    version = __version__
    flags = flags
    aliases = aliases

    app_dir = Unicode('', config=True,
        help="The app directory to target")

    should_build = Bool(False, config=True,
        help="Whether to build the app after the action")

    def _log_format_default(self):
        """A default format for messages"""
        return "%(message)s"


class InstallQuantLabExtensionApp(BaseExtensionApp):
    description = "Install quantlab extension(s)"
    should_build = Bool(True, config=True,
        help="Whether to build the app after the action")

    def start(self):
        self.extra_args = self.extra_args or [os.getcwd()]
        [install_extension(arg, self.app_dir, logger=self.log)
         for arg in self.extra_args]
        if self.should_build:
            build(self.app_dir, logger=self.log)


class LinkQuantLabExtensionApp(BaseExtensionApp):
    description = """
    Link quantlab extension(s) or packages.

    Links a package to the QuantLab build process.  If the package is
    an extension, it will also be installed as an extension.  A linked
    package is manually re-installed from its source location when
    `jupyter quantlab build` is run.
    """
    should_build = Bool(True, config=True,
        help="Whether to build the app after the action")

    def start(self):
        self.extra_args = self.extra_args or [os.getcwd()]
        [link_package(arg, self.app_dir, logger=self.log)
         for arg in self.extra_args]
        if self.should_build:
            build(self.app_dir, logger=self.log)


class UnlinkQuantLabExtensionApp(BaseExtensionApp):
    description = "Unlink quantlab extension(s) or packages by name or path"
    should_build = Bool(True, config=True,
        help="Whether to build the app after the action")

    def start(self):
        self.extra_args = self.extra_args or [os.getcwd()]
        ans = any([unlink_package(arg, self.app_dir, logger=self.log)
                   for arg in self.extra_args])
        if ans and self.should_build:
            build(self.app_dir, logger=self.log)


class UninstallQuantLabExtensionApp(BaseExtensionApp):
    description = "Uninstall quantlab extension(s) by name"
    should_build = Bool(True, config=True,
        help="Whether to build the app after the action")

    def start(self):
        self.extra_args = self.extra_args or [os.getcwd()]
        ans = any([uninstall_extension(arg, self.app_dir, logger=self.log)
                   for arg in self.extra_args])
        if ans and self.should_build:
            build(self.app_dir, logger=self.log)


class ListQuantLabExtensionsApp(BaseExtensionApp):
    description = "List the installed quantlab extensions"

    def start(self):
        list_extensions(self.app_dir, logger=self.log)


class ListLinkedQuantLabExtensionsApp(BaseExtensionApp):
    description = "List the linked packages"

    def start(self):
        linked = _get_linked_packages(self.app_dir, logger=self.log)
        for path in linked.values():
            print(path)


class EnableQuantLabExtensionsApp(BaseExtensionApp):
    description = "Enable quantlab extension(s) by name"

    def start(self):
        [enable_extension(arg, self.app_dir, logger=self.log)
         for arg in self.extra_args]


class DisableQuantLabExtensionsApp(BaseExtensionApp):
    description = "Disable quantlab extension(s) by name"

    def start(self):
        [disable_extension(arg, self.app_dir, logger=self.log)
         for arg in self.extra_args]


_examples = """
jupyter quantlabextension list                        # list all configured labextensions
jupyter quantlabextension install <extension name>    # install a labextension
jupyter quantlabextension uninstall <extension name>  # uninstall a labextension
"""


class QuantLabExtensionApp(JupyterApp):
    """Base jupyter quantlabextension command entry point"""
    name = "jupyter quantlabextension"
    version = __version__
    description = "Work with QuantLab extensions"
    examples = _examples

    subcommands = dict(
        install=(InstallQuantLabExtensionApp, "Install quantlab extension(s)"),
        uninstall=(UninstallQuantLabExtensionApp, "Uninstall quantlab extension(s)"),
        list=(ListQuantLabExtensionsApp, "List quantlab extensions"),
        link=(LinkQuantLabExtensionApp, "Link quantlab extension(s)"),
        unlink=(UnlinkQuantLabExtensionApp, "Unlink quantlab extension(s)"),
        listlinked=(ListLinkedQuantLabExtensionsApp, "List linked quantlab extensions"),
        enable=(EnableQuantLabExtensionsApp, "Enable quantlab extension(s)"),
        disable=(DisableQuantLabExtensionsApp, "Disable quantlab extensions(s)")
    )

    def start(self):
        """Perform the App's functions as configured"""
        super(QuantLabExtensionApp, self).start()

        # The above should have called a subcommand and raised NoStart; if we
        # get here, it didn't, so we should self.log.info a message.
        subcmds = ", ".join(sorted(self.subcommands))
        sys.exit("Please supply at least one subcommand: %s" % subcmds)


main = QuantLabExtensionApp.launch_instance
