**[Prerequisites](#prerequisites)** |
**[Installation](#installation)** |
**[Contributing](#contributing)** |
**[License](#license)** |
**[Getting help](#getting-help)**


# [QuantLab](https://doc.quantlab.io)

[![Build Status](https://travis-ci.org/quantlabio/quantlab.svg?branch=master)](https://travis-ci.org/quantlabio/quantlab)
[![Build status](https://ci.appveyor.com/api/projects/status/yx8r2721ep64pj0j?svg=true)](https://ci.appveyor.com/project/lab4quant/quantlab)
[![Documentation Status](https://readthedocs.org/projects/quantlab-tutorial/badge/?version=latest)](https://quantlab-tutorial.readthedocs.io/en/latest/?badge=latest)
[![Google Group](https://img.shields.io/badge/-Google%20Group-lightgrey.svg)](https://groups.google.com/forum/#!forum/jupyter)

forked from JupterLab, lab for quant

**QuantLab is a very early developer preview, and is not suitable for
general usage yet. Features and implementation are subject to change.**

----

## Prerequisites

Jupyter notebook version 4.2 or later. To check the notebook version:

```bash
jupyter notebook --version
```

### Supported Runtimes

The runtime versions which are currently *known to work*:

- Firefox 49+
- Chrome 39+
- Safari 10+

Earlier browser versions may also work, but come with no guarantees.

QuantLab uses CSS Variables for styling, which is one reason for the
minimum versions listed above.  IE 11+ or Edge 14 do not support
CSS Variables, and are not directly supported at this time.
A tool like [postcss](http://postcss.org/) can be used to convert the CSS files in the
`quantlab/build` directory manually if desired.

----

## Installation

If you use ``conda``, you can install as:

```bash
conda install -c conda-forge quantlab
```

If you use ``pip``, you can install it as:

```bash
pip install quantlab
jupyter serverextension enable --py quantlab --sys-prefix
```

Start up QuantLab:

```bash
jupyter quantlab
```

QuantLab will open automatically in your browser. You may also access
QuantLab by entering the notebook server's URL (`http://localhost:8888`) in
the browser.

Instructions on how to install the project from the git sources are available in our [contributor documentation](CONTRIBUTING.md).

Note: If installing using `pip install --user`, you must add the user-level
 `bin` directory to your `PATH` environment variable in order to launch
 `jupyter quantlab`.


## Extensions

The QuantLab environment can be extended using extensions.  See documentation
for [users](https://quantlab-tutorial.readthedocs.io/en/latest/extensions_user.html) and [developers](https://quantlab-tutorial.readthedocs.io/en/latest/extensions_dev.html).

----

## Contributing

If you would like to contribute to the project, please read our [contributor documentation](CONTRIBUTING.md).

----

## License
We use a shared copyright model that enables all contributors to maintain the
copyright on their contributions.

All code is licensed under the terms of the revised BSD license.

----

## Getting help
We encourage you to ask questions on the [mailing list](https://groups.google.com/forum/#!forum/jupyter),
and you may participate in development discussions.


## Resources

- [Reporting Issues](https://github.com/quantlabio/quantlab/issues)
- [Architecture tutorial](https://quantlab-tutorial.readthedocs.io/en/latest/index.html)
- [API Docs](http://quantlabio.github.io/quantlab/)
- [Documentation for Project Jupyter](https://jupyter.readthedocs.io/en/latest/index.html) | [PDF](https://media.readthedocs.org/pdf/jupyter/latest/jupyter.pdf)
- [Project Jupyter website](https://jupyter.org)
