/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import * as fs from 'fs-extra';
import * as path from 'path';
import * as utils from './utils';

// Ensure the repo is in a stable state.
utils.run('qlpm integrity');

// Get the dev mode package.json file.
let data = utils.readJSONFile('./dev_mode/package.json');

// Update the values that need to change and write to staging.
data['scripts']['build'] = 'webpack';
data['scripts']['watch'] = 'webpack --watch';
data['scripts']['build:prod'] = "webpack --define process.env.NODE_ENV=\"'production'\"";
data['quantlab']['outputDir'] = '..';
data['quantlab']['staticDir'] = '../static';
data['quantlab']['linkedPackages'] = {};

let staging = './quantlab/staging';
utils.writePackageData(path.join(staging, 'package.json'), data);

// Update our index file and webpack file.
fs.copySync('./dev_mode/index.js', './quantlab/staging/index.js');
fs.copySync('./dev_mode/webpack.config.js',
            './quantlab/staging/webpack.config.js');


// Create a new yarn.lock file to ensure it is correct.
fs.removeSync(path.join(staging, 'yarn.lock'));
utils.run('qlpm', { cwd: staging });


// Build the core assets.
utils.run('qlpm run build:prod', { cwd: staging });
