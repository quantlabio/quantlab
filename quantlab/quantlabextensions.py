# coding: utf-8
"""Jupyter QuantLabExtension Entry Points."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.
from __future__ import print_function

import os
import sys
import traceback

from jupyter_core.application import JupyterApp, base_flags, base_aliases

from traitlets import Bool, Unicode

from .commands import (
    install_extension, uninstall_extension, list_extensions,
    enable_extension, disable_extension,
    link_package, unlink_package, build, get_app_version
)


flags = dict(base_flags)
flags['no-build'] = (
    {'BaseExtensionApp': {'should_build': False}},
    "Defer building the app after the action."
)
flags['clean'] = (
    {'BaseExtensionApp': {'should_clean': True}},
    "Cleanup intermediate files after the action."
)

aliases = dict(base_aliases)
aliases['app-dir'] = 'BaseExtensionApp.app_dir'

VERSION = get_app_version()


class BaseExtensionApp(JupyterApp):
    version = VERSION
    flags = flags
    aliases = aliases

    app_dir = Unicode('', config=True,
        help="The app directory to target")

    should_build = Bool(False, config=True,
        help="Whether to build the app after the action")

    should_clean = Bool(False, config=True,
        help="Whether temporary files should be cleaned up after building quantlab")

    def start(self):
        try:
            self.run_task()
        except Exception as ex:
            _, _, exc_traceback = sys.exc_info()
            msg = traceback.format_exception(ex.__class__, ex, exc_traceback)
            for line in msg:
                self.log.debug(line)
            self.log.error(str(ex))
            sys.exit(1)

    def run_task(self):
        pass
    def _log_format_default(self):
        """A default format for messages"""
        return "%(message)s"


class InstallQuantLabExtensionApp(BaseExtensionApp):
    description = "Install quantlab extension(s)"
    should_build = Bool(True, config=True,
        help="Whether to build the app after the action")

    def run_task(self):
        self.extra_args = self.extra_args or [os.getcwd()]
        [install_extension(arg, self.app_dir, logger=self.log) for
         arg in self.extra_args]

        if self.should_build:
            build(self.app_dir, clean_staging=self.should_clean,
                 logger=self.log)


class LinkQuantLabExtensionApp(BaseExtensionApp):
    description = """
    Link local npm packages that are not quantlab extensions.
    Links a package to the QuantLab build process. A linked
    package is manually re-installed from its source location when
    `jupyter quantlab build` is run.
    """
    should_build = Bool(True, config=True,
        help="Whether to build the app after the action")

    def run_task(self):
        self.extra_args = self.extra_args or [os.getcwd()]
        [link_package(arg, self.app_dir, logger=self.log)
         for arg in self.extra_args]

        if self.should_build:
            build(self.app_dir, clean_staging=self.should_clean,
                  logger=self.log)


class UnlinkQuantLabExtensionApp(BaseExtensionApp):
    description = "Unlink quantlab extension(s) or packages by name or path"
    should_build = Bool(True, config=True,
        help="Whether to build the app after the action")

    def run_task(self):
        self.extra_args = self.extra_args or [os.getcwd()]
        ans = any([unlink_package(arg, self.app_dir, logger=self.log)
                   for arg in self.extra_args])
        if ans and self.should_build:
            build(self.app_dir, clean_staging=self.should_clean,
                  logger=self.log)


class UninstallQuantLabExtensionApp(BaseExtensionApp):
    description = "Uninstall quantlab extension(s) by name"
    should_build = Bool(True, config=True,
        help="Whether to build the app after the action")

    def run_task(self):
        self.extra_args = self.extra_args or [os.getcwd()]
        ans = any([uninstall_extension(arg, self.app_dir, logger=self.log)
                   for arg in self.extra_args])
        if ans and self.should_build:
            build(self.app_dir, clean_staging=self.should_clean,
                  logger=self.log)


class ListQuantLabExtensionsApp(BaseExtensionApp):
    description = "List the installed quantlab extensions"

    def run_task(self):
        list_extensions(self.app_dir, logger=self.log)


class EnableQuantLabExtensionsApp(BaseExtensionApp):
    description = "Enable quantlab extension(s) by name"

    def run_task(self):
        [enable_extension(arg, self.app_dir, logger=self.log)
         for arg in self.extra_args]


class DisableQuantLabExtensionsApp(BaseExtensionApp):
    description = "Disable quantlab extension(s) by name"

    def run_task(self):
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
    version = VERSION
    description = "Work with QuantLab extensions"
    examples = _examples

    subcommands = dict(
        install=(InstallQuantLabExtensionApp, "Install quantlab extension(s)"),
        uninstall=(UninstallQuantLabExtensionApp, "Uninstall quantlab extension(s)"),
        list=(ListQuantLabExtensionsApp, "List quantlab extensions"),
        link=(LinkQuantLabExtensionApp, "Link quantlab extension(s)"),
        unlink=(UnlinkQuantLabExtensionApp, "Unlink quantlab extension(s)"),
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
