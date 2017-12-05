#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.
from os.path import join as pjoin
import json
import os
import sys

# Our own imports
from setupbase import (
    create_cmdclass, ensure_python, find_packages, get_version,
    command_for_func, combine_commands, install_npm, HERE, run
)

from setuptools import setup


NAME = 'quantlab'
DESCRIPTION = 'An alpha preview of the QuantLab notebook server extension.'
LONG_DESCRIPTION = """
This is an alpha preview of QuantLab. It is not ready for general usage yet.
Development happens on https://github.com/quantlabio/quantlab

"""

ensure_python(['2.7', '>=3.3'])

data_files_spec = [
    ('share/jupyter/quantlab/static', '%s/static' % NAME, '**'),
    ('share/jupyter/quantlab/schemas', '%s/schemas' % NAME, '**'),
    ('share/jupyter/quantlab/themes', '%s/themes' % NAME, '**')
]

package_data_spec = dict()
package_data_spec[NAME] = [
    'staging/*', 'static/**', 'tests/mock_packages/**', 'themes/**',
    'schemas/**'
]

staging = pjoin(HERE, NAME, 'staging')
npm = ['node', pjoin(staging, 'yarn.js')]
VERSION = get_version('%s/_version.py' % NAME)


def check_assets():
    from distutils.version import LooseVersion

    # Representative files that should exist after a successful build
    targets = [
        'static/package.json',
        'schemas/@quantlab/shortcuts-extension/plugin.json',
        'themes/@quantlab/theme-light-extension/images/quantlab.svg'
    ]

    for t in targets:
        if not os.path.exists(pjoin(HERE, NAME, t)):
            msg = ('Missing file: %s, `build:prod` script did not complete '
                   'successfully' % t)
            raise ValueError(msg)

    #if 'develop' in sys.argv:
    #    run(npm, cwd=HERE)

    if 'sdist' not in sys.argv and 'bdist_wheel' not in sys.argv:
        return

    target = pjoin(HERE, NAME, 'static', 'package.json')
    with open(target) as fid:
        version = json.load(fid)['quantlab']['version']

    if LooseVersion(version) != LooseVersion(VERSION):
        raise ValueError('Version mismatch, please run `build:update`')


setup_args = dict(
    name             = NAME,
    description      = DESCRIPTION,
    long_description = LONG_DESCRIPTION,
    version          = VERSION,
    packages         = find_packages(),
    author           = 'QuantLab Development Team',
    author_email     = 'quantlab.io@gmail.com',
    url              = 'https://www.quantlab.io',
    license          = 'BSD',
    platforms        = "Linux, Mac OS X, Windows",
    keywords         = ['ipython', 'jupyter', 'Web', 'quant'],
    classifiers      = [
        'Development Status :: 3 - Alpha',
        'Intended Audience :: Developers',
        'Intended Audience :: System Administrators',
        'Intended Audience :: Science/Research',
        'License :: OSI Approved :: BSD License',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6'
    ],
)


setup_args['install_requires'] = [
    'notebook>=4.3.1',
    'quantlab_launcher>=0.3.0',
    'ipython_genutils',
    'futures;python_version<"3.0"',
    'subprocess32;python_version<"3.0"'
]

setup_args['extras_require'] = {
    'test:python_version == "2.7"': ['mock'],
    'test': ['pytest', 'requests', 'pytest-check-links', 'selenium'],
    'docs': [
        'sphinx',
        'recommonmark',
        'sphinx_rtd_theme'
    ],
}


# Because of this we do not need a MANIFEST.in
setup_args['include_package_data'] = True

# Force entrypoints with setuptools (needed for Windows, unconditional
# because of wheels)
setup_args['entry_points'] = {
    'console_scripts': [
        'jupyter-quantlab = quantlab_launcher.quantlabapp:main',
        'jupyter-quantlabextension = quantlab.quantlabextensions:main',
        'jupyter-quantlabhub = quantlab.quantlabhubapp:main',
        'qlpm = quantlab.qlpmapp:main',
    ]
}


if __name__ == '__main__':
    setup(**setup_args)
