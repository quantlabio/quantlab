#!/bin/bash

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

set -ex
export DISPLAY=:99.0
sh -e /etc/init.d/xvfb start || true

export PATH="$HOME/miniconda/bin:$PATH"


npm run build:examples


if [[ $GROUP == tests ]]; then

    # Run the JS and python tests
    py.test
    npm run clean
    npm run build:src
    npm run build:test
    npm test
    npm run test:services || npm run test:services

    # Make sure we have CSS that can be converted with postcss
    npm install -g postcss-cli
    postcss packages/**/style/*.css --dir /tmp

    # Run the publish script in quantlab
    cd quantlab
    npm run publish

    if [ ! -f ./build/release_data.json ]; then
        echo "npm publish in quantlab unsucessful!"
    fi
fi


if [[ $GROUP == coverage_and_docs ]]; then
    # Run the coverage and python tests.
    py.test
    npm run build
    npm run build:test
    npm run coverage

    # Run the link check
    pip install -q pytest-check-links
    py.test --check-links -k .md .

    # Build the api docs
    npm run docs
    cp jupyter_plugins.png docs

    # Verify tutorial docs build
    pushd docs
    conda env create -n test_docs -f environment.yml
    source activate test_docs
    make html
    source deactivate
    popd
fi


if [[ $GROUP == cli ]]; then
    # Make sure we can successfully load the core app.
    pip install selenium
    python -m quantlab.selenium_check --core-mode

    # Make sure we can build and run the app.
    jupyter quantlab build
    python -m quantlab.selenium_check
    jupyter labextension list

    # Test the cli apps.
    jupyter quantlab clean
    jupyter quantlab build
    jupyter quantlab path
    jupyter quantlabextension link quantlab/tests/mockextension --no-build
    jupyter quantlabextension unlink quantlab/tests/mockextension --no-build
    jupyter quantlabextension link quantlab/tests/mockextension --no-build
    jupyter quantlabextension listlinked
    jupyter quantlabextension unlink  @quantlab/python-tests --no-build
    jupyter quantlabextension install quantlab/tests/mockextension  --no-build
    jupyter quantlabextension list
    jupyter quantlabextension disable @quantlab/python-tests
    jupyter quantlabextension enable @quantlab/python-tests
    jupyter quantlabextension disable @quantlab/notebook-extension
    jupyter quantlabextension uninstall @quantlab/python-tests --no-build
    jupyter quantlabextension uninstall @quantlab/notebook-extension --no-build

    # Make sure we can call help on all the cli apps.
    jupyter quantlab -h
    jupyter quantlab build -h
    jupyter quantlab clean -h
    jupyter quantlab path -h
    jupyter quantlabextension link -h
    jupyter quantlabextension unlink -h
    jupyter quantlabextension install -h
    jupyter quantlabextension uninstall -h
    jupyter quantlabextension list -h
    jupyter quantlabextension listlinked -h
    jupyter quantlabextension enable -h
    jupyter quantlabextension disable -h
fi
